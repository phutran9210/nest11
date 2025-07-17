import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

/**
 * Get client IP address from request
 */
export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>()

  // Check for IP from various headers (proxy, load balancer, etc.)
  return (
    request.ip ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (request.headers['x-real-ip'] as string) ||
    (request.headers['x-client-ip'] as string) ||
    (request.headers['cf-connecting-ip'] as string) || // Cloudflare
    'unknown'
  )
})

/**
 * Get user agent from request
 */
export const UserAgent = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>()
  return request.headers['user-agent'] || 'unknown'
})
