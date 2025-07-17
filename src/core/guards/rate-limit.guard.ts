import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { Request, Response } from 'express'
import type { RateLimitConfig, RateLimitService } from '~core/security'

export const RATE_LIMIT_KEY = 'rate_limit'

export interface RateLimitOptions extends Partial<RateLimitConfig> {
  keyGenerator?: (req: Request) => string
  skipIf?: (req: Request) => boolean
  message?: string
}

/**
 * Decorator to apply rate limiting to routes
 */
export const RateLimit = (options: RateLimitOptions = {}) => SetMetadata(RATE_LIMIT_KEY, options)

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name)
  private readonly rateLimitService: RateLimitService
  private readonly reflector: Reflector

  constructor(rateLimitService: RateLimitService, reflector: Reflector) {
    this.rateLimitService = rateLimitService
    this.reflector = reflector
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!options) {
      return true // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    // Skip rate limiting if skipIf condition is met
    if (options.skipIf?.(request)) {
      return true
    }

    // Generate rate limit key
    const key = options.keyGenerator ? options.keyGenerator(request) : this.getDefaultKey(request)

    // Default rate limit config
    const config: RateLimitConfig = {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      ...options,
    }

    try {
      const result = await this.rateLimitService.checkRateLimit(key, config, request.ip)

      // Set rate limit headers
      response.setHeader('X-RateLimit-Limit', config.maxAttempts)
      response.setHeader('X-RateLimit-Remaining', result.remaining)
      response.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

      if (result.blocked) {
        response.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000))

        const message =
          options.message ||
          (result.blockExpiresAt
            ? `Too many requests. Blocked until ${new Date(result.blockExpiresAt).toISOString()}`
            : 'Too many requests')

        this.logger.warn(`Rate limit blocked: ${key} from ${request.ip}`)

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message,
            error: 'Too Many Requests',
            retryAfter: result.resetTime,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      if (!result.allowed) {
        response.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000))

        const message = options.message || 'Too many requests'
        this.logger.warn(`Rate limit exceeded: ${key} from ${request.ip}`)

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message,
            error: 'Too Many Requests',
            retryAfter: result.resetTime,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      return true
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Rate limit guard error for key: ${key}`, error)
      // Fail open - allow request if rate limiting fails
      return true
    }
  }

  private getDefaultKey(request: Request): string {
    const ip = this.getClientIp(request)
    const route = (request.route as { path?: string })?.path || request.path
    return `${request.method}:${route}:${ip}`
  }

  private getClientIp(request: Request): string {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      (request.headers['x-client-ip'] as string) ||
      (request.headers['cf-connecting-ip'] as string) ||
      'unknown'
    )
  }
}
