import { Injectable, Logger } from '@nestjs/common'
import type Redis from 'ioredis'

@Injectable()
export class RedisListService {
  private readonly logger = new Logger(RedisListService.name)
  private readonly client: Redis | null

  constructor(client: Redis | null) {
    this.client = client
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping lpush operation')
      return 0
    }
    try {
      return await this.client.lpush(key, ...values)
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error)
      throw error
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping rpush operation')
      return 0
    }
    try {
      return await this.client.rpush(key, ...values)
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error)
      throw error
    }
  }

  async lpop(key: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping lpop operation')
      return null
    }
    try {
      return await this.client.lpop(key)
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error)
      throw error
    }
  }

  async rpop(key: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping rpop operation')
      return null
    }
    try {
      return await this.client.rpop(key)
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error)
      throw error
    }
  }

  async llen(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping llen operation')
      return 0
    }
    try {
      return await this.client.llen(key)
    } catch (error) {
      this.logger.error(`Error getting length of list ${key}:`, error)
      throw error
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping lrange operation')
      return []
    }
    try {
      return await this.client.lrange(key, start, stop)
    } catch (error) {
      this.logger.error(`Error getting range from list ${key}:`, error)
      throw error
    }
  }

  async lindex(key: string, index: number): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping lindex operation')
      return null
    }
    try {
      return await this.client.lindex(key, index)
    } catch (error) {
      this.logger.error(`Error getting element at index ${index} from list ${key}:`, error)
      throw error
    }
  }

  async lset(key: string, index: number, value: string): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping lset operation')
      return 'OK'
    }
    try {
      return await this.client.lset(key, index, value)
    } catch (error) {
      this.logger.error(`Error setting element at index ${index} in list ${key}:`, error)
      throw error
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping ltrim operation')
      return 'OK'
    }
    try {
      return await this.client.ltrim(key, start, stop)
    } catch (error) {
      this.logger.error(`Error trimming list ${key}:`, error)
      throw error
    }
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping lrem operation')
      return 0
    }
    try {
      return await this.client.lrem(key, count, value)
    } catch (error) {
      this.logger.error(`Error removing elements from list ${key}:`, error)
      throw error
    }
  }

  // Blocking operations
  async blpop(timeout: number, ...keys: string[]): Promise<[string, string] | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping blpop operation')
      return null
    }
    try {
      return await this.client.blpop(...keys, timeout)
    } catch (error) {
      this.logger.error(`Error blocking pop from lists:`, error)
      throw error
    }
  }

  async brpop(timeout: number, ...keys: string[]): Promise<[string, string] | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping brpop operation')
      return null
    }
    try {
      return await this.client.brpop(...keys, timeout)
    } catch (error) {
      this.logger.error(`Error blocking pop from lists:`, error)
      throw error
    }
  }
}
