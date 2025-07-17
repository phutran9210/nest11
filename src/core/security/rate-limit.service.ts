import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '~core/redis'

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number // Time window in milliseconds
  blockDurationMs: number // Block duration in milliseconds
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked: boolean
  blockExpiresAt?: number
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check and increment rate limit for a given key
   */
  async checkRateLimit(
    key: string,
    config: RateLimitConfig,
    identifier?: string,
  ): Promise<RateLimitResult> {
    const rateLimitKey = `rate_limit:${key}`
    const blockKey = `rate_limit_block:${key}`
    const now = Date.now()

    try {
      // Check if client is currently blocked
      const blockExpiry = await this.redisService.utility.ttl(blockKey)
      if (blockExpiry > 0) {
        const blockExpiresAt = now + blockExpiry * 1000
        this.logger.warn(
          `Rate limit blocked for key: ${key}${identifier ? ` (${identifier})` : ''}, expires at: ${new Date(blockExpiresAt).toISOString()}`,
        )

        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiresAt,
          blocked: true,
          blockExpiresAt,
        }
      }

      // Get current attempt count within window
      const pipeline = this.redisService.utility.pipeline()
      pipeline.get(rateLimitKey)
      pipeline.ttl(rateLimitKey)

      const results = await pipeline.exec()
      const currentCount = results?.[0]?.[1] ? parseInt(results[0][1] as string, 10) : 0
      const ttl = results?.[1]?.[1] as number

      let remaining = config.maxAttempts - currentCount
      let resetTime = now + config.windowMs

      // If key exists and has TTL, use existing reset time
      if (ttl > 0) {
        resetTime = now + ttl * 1000
      }

      // Check if limit is exceeded
      if (currentCount >= config.maxAttempts) {
        // Block the client
        await this.redisService.utility.setex(
          blockKey,
          Math.floor(config.blockDurationMs / 1000),
          'blocked',
        )

        const blockExpiresAt = now + config.blockDurationMs
        this.logger.warn(
          `Rate limit exceeded for key: ${key}${identifier ? ` (${identifier})` : ''}, blocking until: ${new Date(blockExpiresAt).toISOString()}`,
        )

        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiresAt,
          blocked: true,
          blockExpiresAt,
        }
      }

      // Increment counter
      if (currentCount === 0) {
        // First request in window
        await this.redisService.utility.setex(rateLimitKey, Math.floor(config.windowMs / 1000), '1')
        remaining = config.maxAttempts - 1
      } else {
        // Increment existing counter
        await this.redisService.utility.incr(rateLimitKey)
        remaining = config.maxAttempts - (currentCount + 1)
      }

      return {
        allowed: true,
        remaining: Math.max(0, remaining),
        resetTime,
        blocked: false,
      }
    } catch (error) {
      this.logger.error(`Error checking rate limit for key: ${key}`, error)
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: now + config.windowMs,
        blocked: false,
      }
    }
  }

  /**
   * Rate limit for login attempts by IP address
   */
  async checkLoginAttempts(
    ipAddress: string,
    config: Partial<RateLimitConfig> = {},
  ): Promise<RateLimitResult> {
    const defaultConfig: RateLimitConfig = {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      ...config,
    }

    return this.checkRateLimit(`login:${ipAddress}`, defaultConfig, ipAddress)
  }

  /**
   * Rate limit for login attempts by username
   */
  async checkUsernameAttempts(
    username: string,
    config: Partial<RateLimitConfig> = {},
  ): Promise<RateLimitResult> {
    const defaultConfig: RateLimitConfig = {
      maxAttempts: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour
      ...config,
    }

    return this.checkRateLimit(`login_user:${username.toLowerCase()}`, defaultConfig, username)
  }

  /**
   * Reset rate limit for a key (useful for successful login)
   */
  async resetRateLimit(key: string): Promise<void> {
    const rateLimitKey = `rate_limit:${key}`
    const blockKey = `rate_limit_block:${key}`

    try {
      await Promise.all([
        this.redisService.utility.del(rateLimitKey),
        this.redisService.utility.del(blockKey),
      ])

      this.logger.debug(`Rate limit reset for key: ${key}`)
    } catch (error) {
      this.logger.error(`Error resetting rate limit for key: ${key}`, error)
    }
  }

  /**
   * Reset login rate limits for IP and username
   */
  async resetLoginRateLimit(ipAddress: string, username?: string): Promise<void> {
    const promises = [this.resetRateLimit(`login:${ipAddress}`)]

    if (username) {
      promises.push(this.resetRateLimit(`login_user:${username.toLowerCase()}`))
    }

    await Promise.all(promises)
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(key: string): Promise<Omit<RateLimitResult, 'allowed'>> {
    const rateLimitKey = `rate_limit:${key}`
    const blockKey = `rate_limit_block:${key}`
    const now = Date.now()

    try {
      const blockExpiry = await this.redisService.utility.ttl(blockKey)
      if (blockExpiry > 0) {
        const blockExpiresAt = now + blockExpiry * 1000
        return {
          remaining: 0,
          resetTime: blockExpiresAt,
          blocked: true,
          blockExpiresAt,
        }
      }

      const pipeline = this.redisService.utility.pipeline()
      pipeline.get(rateLimitKey)
      pipeline.ttl(rateLimitKey)

      const results = await pipeline.exec()
      const currentCount = results?.[0]?.[1] ? parseInt(results[0][1] as string, 10) : 0
      const ttl = results?.[1]?.[1] as number

      const resetTime = ttl > 0 ? now + ttl * 1000 : now

      return {
        remaining: Math.max(0, 5 - currentCount), // Default max attempts
        resetTime,
        blocked: false,
      }
    } catch (error) {
      this.logger.error(`Error getting rate limit status for key: ${key}`, error)
      return {
        remaining: 5,
        resetTime: now,
        blocked: false,
      }
    }
  }
}
