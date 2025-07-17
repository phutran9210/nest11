import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { RedisService } from '~core/redis'
import { UserEntity } from '~shared/entities/user.entity'

@Injectable()
export class UserCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly redisService: RedisService,
  ) {}

  // Using Cache Manager (recommended for basic caching)
  async getUserFromCache(userId: string): Promise<UserEntity | null> {
    const cacheKey = `user:${userId}`
    const result = await this.cacheManager.get<UserEntity>(cacheKey)
    return result ?? null
  }

  async setUserCache(userId: string, user: UserEntity, ttl = 300): Promise<void> {
    const cacheKey = `user:${userId}`
    await this.cacheManager.set(cacheKey, user, ttl * 1000)
  }

  async deleteUserCache(userId: string): Promise<void> {
    const cacheKey = `user:${userId}`
    await this.cacheManager.del(cacheKey)
  }

  // Using Redis Service directly (for advanced operations)
  async setUserSession(
    userId: string,
    sessionData: Record<string, unknown>,
    ttl = 3600,
  ): Promise<void> {
    const sessionKey = `session:${userId}`
    await this.redisService.set(sessionKey, JSON.stringify(sessionData), ttl)
  }

  async getUserSession(userId: string): Promise<Record<string, unknown> | null> {
    const sessionKey = `session:${userId}`
    const sessionData = await this.redisService.get(sessionKey)
    return sessionData ? (JSON.parse(sessionData) as Record<string, unknown>) : null
  }

  async deleteUserSession(userId: string): Promise<void> {
    const sessionKey = `session:${userId}`
    await this.redisService.del(sessionKey)
  }

  // User activity tracking with Redis Hash
  async trackUserActivity(userId: string, action: string): Promise<void> {
    const activityKey = `activity:${userId}`
    const timestamp = Date.now().toString()
    await this.redisService.hset(activityKey, action, timestamp)
    await this.redisService.expire(activityKey, 86400) // 24 hours
  }

  async getUserActivity(userId: string): Promise<Record<string, string>> {
    const activityKey = `activity:${userId}`
    return await this.redisService.hgetall(activityKey)
  }

  // Online users tracking with Redis Set
  async setUserOnline(userId: string): Promise<void> {
    await this.redisService.sadd('users:online', userId)
    await this.redisService.set(`user:${userId}:last_seen`, Date.now().toString(), 300)
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.redisService.sets.srem('users:online', userId)
    await this.redisService.utility.del(`user:${userId}:last_seen`)
  }

  async getOnlineUsers(): Promise<string[]> {
    return await this.redisService.smembers('users:online')
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.redisService.sismember('users:online', userId)
    return result === 1
  }

  // Notification queue with Redis List
  async addNotification(userId: string, notification: Record<string, unknown>): Promise<void> {
    const notificationKey = `notifications:${userId}`
    await this.redisService.lpush(notificationKey, JSON.stringify(notification))
  }

  async getNotifications(userId: string): Promise<Record<string, unknown>[]> {
    const notificationKey = `notifications:${userId}`
    const notifications = await this.redisService.list.lrange(notificationKey, 0, -1)
    return notifications.map((n) => JSON.parse(n) as Record<string, unknown>)
  }

  async popNotification(userId: string): Promise<Record<string, unknown> | null> {
    const notificationKey = `notifications:${userId}`
    const notification = await this.redisService.rpop(notificationKey)
    return notification ? (JSON.parse(notification) as Record<string, unknown>) : null
  }

  // User preferences with JSON (requires Redis Stack)
  async setUserPreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
    const prefKey = `preferences:${userId}`
    try {
      await this.redisService.jsonSet(prefKey, '$', preferences)
    } catch {
      // Fallback to regular string storage if JSON module not available
      await this.redisService.set(prefKey, JSON.stringify(preferences))
    }
  }

  async getUserPreferences(userId: string): Promise<Record<string, unknown> | null> {
    const prefKey = `preferences:${userId}`
    try {
      const result = await this.redisService.jsonGet(prefKey)
      return result as Record<string, unknown> | null
    } catch {
      // Fallback to regular string retrieval
      const preferences = await this.redisService.get(prefKey)
      return preferences ? (JSON.parse(preferences) as Record<string, unknown>) : null
    }
  }

  // Bulk operations with Pipeline
  async cacheMultipleUsers(users: { id: string; data: UserEntity }[]): Promise<void> {
    const pipeline = this.redisService.pipeline()

    users.forEach(({ id, data }) => {
      const cacheKey = `user:${id}`
      pipeline.setex(cacheKey, 300, JSON.stringify(data))
    })

    await pipeline.exec()
  }

  // Rate limiting
  async checkRateLimit(userId: string, action: string, limit = 10, window = 60): Promise<boolean> {
    const key = `rate_limit:${userId}:${action}`
    const current = await this.redisService.get(key)

    if (!current) {
      await this.redisService.set(key, '1', window)
      return true
    }

    const count = parseInt(current, 10)
    if (count >= limit) {
      return false
    }

    await this.redisService.incr(key)
    return true
  }
}
