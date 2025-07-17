import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisSetService {
  private readonly logger = new Logger(RedisSetService.name)
  private readonly client: Redis | null

  constructor(client: Redis | null) {
    this.client = client
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sadd operation')
      return 0
    }
    try {
      return await this.client.sadd(key, ...members)
    } catch (error) {
      this.logger.error(`Error adding to set ${key}:`, error)
      throw error
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping srem operation')
      return 0
    }
    try {
      return await this.client.srem(key, ...members)
    } catch (error) {
      this.logger.error(`Error removing from set ${key}:`, error)
      throw error
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping smembers operation')
      return []
    }
    try {
      return await this.client.smembers(key)
    } catch (error) {
      this.logger.error(`Error getting members of set ${key}:`, error)
      throw error
    }
  }

  async sismember(key: string, member: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sismember operation')
      return 0
    }
    try {
      return await this.client.sismember(key, member)
    } catch (error) {
      this.logger.error(`Error checking membership in set ${key}:`, error)
      throw error
    }
  }

  async scard(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping scard operation')
      return 0
    }
    try {
      return await this.client.scard(key)
    } catch (error) {
      this.logger.error(`Error getting cardinality of set ${key}:`, error)
      throw error
    }
  }

  async spop(key: string, count?: number): Promise<string | string[] | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping spop operation')
      return null
    }
    try {
      if (count !== undefined) {
        return await this.client.spop(key, count)
      }
      return await this.client.spop(key)
    } catch (error) {
      this.logger.error(`Error popping from set ${key}:`, error)
      throw error
    }
  }

  async srandmember(key: string, count?: number): Promise<string | string[] | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping srandmember operation')
      return null
    }
    try {
      if (count !== undefined) {
        return await this.client.srandmember(key, count)
      }
      return await this.client.srandmember(key)
    } catch (error) {
      this.logger.error(`Error getting random member from set ${key}:`, error)
      throw error
    }
  }

  // Set operations between multiple sets
  async sunion(...keys: string[]): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sunion operation')
      return []
    }
    try {
      return await this.client.sunion(...keys)
    } catch (error) {
      this.logger.error(`Error getting union of sets:`, error)
      throw error
    }
  }

  async sinter(...keys: string[]): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sinter operation')
      return []
    }
    try {
      return await this.client.sinter(...keys)
    } catch (error) {
      this.logger.error(`Error getting intersection of sets:`, error)
      throw error
    }
  }

  async sdiff(...keys: string[]): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sdiff operation')
      return []
    }
    try {
      return await this.client.sdiff(...keys)
    } catch (error) {
      this.logger.error(`Error getting difference of sets:`, error)
      throw error
    }
  }

  async sunionstore(destination: string, ...keys: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sunionstore operation')
      return 0
    }
    try {
      return await this.client.sunionstore(destination, ...keys)
    } catch (error) {
      this.logger.error(`Error storing union of sets:`, error)
      throw error
    }
  }

  async sinterstore(destination: string, ...keys: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sinterstore operation')
      return 0
    }
    try {
      return await this.client.sinterstore(destination, ...keys)
    } catch (error) {
      this.logger.error(`Error storing intersection of sets:`, error)
      throw error
    }
  }

  async sdiffstore(destination: string, ...keys: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping sdiffstore operation')
      return 0
    }
    try {
      return await this.client.sdiffstore(destination, ...keys)
    } catch (error) {
      this.logger.error(`Error storing difference of sets:`, error)
      throw error
    }
  }
}
