import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisUtilityService {
  private readonly logger = new Logger(RedisUtilityService.name)
  private readonly client: Redis | null

  constructor(client: Redis | null) {
    this.client = client
  }

  // Key management operations
  async del(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping del operation')
      return 0
    }
    try {
      return await this.client.del(key)
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error)
      throw error
    }
  }

  async exists(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping exists operation')
      return 0
    }
    try {
      return await this.client.exists(key)
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error)
      throw error
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping expire operation')
      return 0
    }
    try {
      return await this.client.expire(key, seconds)
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error)
      throw error
    }
  }

  async expireat(key: string, timestamp: number): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping expireat operation')
      return 0
    }
    try {
      return await this.client.expireat(key, timestamp)
    } catch (error) {
      this.logger.error(`Error setting expiration timestamp for key ${key}:`, error)
      throw error
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping ttl operation')
      return -1
    }
    try {
      return await this.client.ttl(key)
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error)
      throw error
    }
  }

  async persist(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping persist operation')
      return 0
    }
    try {
      return await this.client.persist(key)
    } catch (error) {
      this.logger.error(`Error removing expiration from key ${key}:`, error)
      throw error
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping keys operation')
      return []
    }
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error)
      throw error
    }
  }

  async scan(cursor: number, pattern?: string, count?: number): Promise<[string, string[]]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping scan operation')
      return ['0', []]
    }
    try {
      if (pattern && count) {
        return await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count)
      } else if (pattern) {
        return await this.client.scan(cursor, 'MATCH', pattern)
      } else if (count) {
        return await this.client.scan(cursor, 'COUNT', count)
      } else {
        return await this.client.scan(cursor)
      }
    } catch (error) {
      this.logger.error(`Error scanning keys:`, error)
      throw error
    }
  }

  async type(key: string): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping type operation')
      return 'none'
    }
    try {
      return await this.client.type(key)
    } catch (error) {
      this.logger.error(`Error getting type of key ${key}:`, error)
      throw error
    }
  }

  async rename(key: string, newKey: string): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping rename operation')
      return 'OK'
    }
    try {
      return await this.client.rename(key, newKey)
    } catch (error) {
      this.logger.error(`Error renaming key ${key} to ${newKey}:`, error)
      throw error
    }
  }

  async renamenx(key: string, newKey: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping renamenx operation')
      return 0
    }
    try {
      return await this.client.renamenx(key, newKey)
    } catch (error) {
      this.logger.error(`Error renaming key ${key} to ${newKey} (if not exists):`, error)
      throw error
    }
  }

  // Database operations
  async ping(): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping ping operation')
      return 'PONG'
    }
    try {
      return await this.client.ping()
    } catch (error) {
      this.logger.error('Error pinging Redis:', error)
      throw error
    }
  }

  async flushdb(): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping flushdb operation')
      return 'OK'
    }
    try {
      return await this.client.flushdb()
    } catch (error) {
      this.logger.error('Error flushing database:', error)
      throw error
    }
  }

  async flushall(): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping flushall operation')
      return 'OK'
    }
    try {
      return await this.client.flushall()
    } catch (error) {
      this.logger.error('Error flushing all databases:', error)
      throw error
    }
  }

  async dbsize(): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping dbsize operation')
      return 0
    }
    try {
      return await this.client.dbsize()
    } catch (error) {
      this.logger.error('Error getting database size:', error)
      throw error
    }
  }

  async select(db: number): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping select operation')
      return 'OK'
    }
    try {
      return await this.client.select(db)
    } catch (error) {
      this.logger.error(`Error selecting database ${db}:`, error)
      throw error
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping setex operation')
      return 'OK'
    }
    try {
      return await this.client.setex(key, seconds, value)
    } catch (error) {
      this.logger.error(`Error setting key ${key} with expiration:`, error)
      throw error
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping incr operation')
      return 0
    }
    try {
      return await this.client.incr(key)
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error)
      throw error
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping get operation')
      return null
    }
    try {
      return await this.client.get(key)
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error)
      throw error
    }
  }

  // Pipeline and transaction operations
  pipeline() {
    if (!this.client) {
      throw new Error('Redis client not available for pipeline operations')
    }
    return this.client.pipeline()
  }

  multi() {
    if (!this.client) {
      throw new Error('Redis client not available for multi operations')
    }
    return this.client.multi()
  }

  // Connection info
  getConnectionStatus(): string {
    if (!this.client) {
      return 'disconnected'
    }
    return this.client.status
  }

  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready'
  }
}
