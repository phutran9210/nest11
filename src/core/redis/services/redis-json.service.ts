import { Injectable, Logger } from '@nestjs/common'
import type Redis from 'ioredis'

@Injectable()
export class RedisJsonService {
  private readonly logger = new Logger(RedisJsonService.name)
  private readonly client: Redis | null

  constructor(client: Redis | null) {
    this.client = client
  }

  // JSON operations (requires Redis Stack or RedisJSON module)
  async jsonGet(key: string, path = '$'): Promise<unknown> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonGet operation')
      return null
    }
    try {
      return await this.client.call('JSON.GET', key, path)
    } catch (error) {
      this.logger.error(`Error getting JSON from key ${key}:`, error)
      throw error
    }
  }

  async jsonSet(key: string, path: string, value: unknown): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonSet operation')
      return 'OK'
    }
    try {
      const result = await this.client.call('JSON.SET', key, path, JSON.stringify(value))
      return result as string
    } catch (error) {
      this.logger.error(`Error setting JSON in key ${key}:`, error)
      throw error
    }
  }

  async jsonDel(key: string, path = '$'): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonDel operation')
      return 0
    }
    try {
      const result = await this.client.call('JSON.DEL', key, path)
      return result as number
    } catch (error) {
      this.logger.error(`Error deleting JSON path from key ${key}:`, error)
      throw error
    }
  }

  async jsonType(key: string, path = '$'): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonType operation')
      return null
    }
    try {
      const result = await this.client.call('JSON.TYPE', key, path)
      return result as string
    } catch (error) {
      this.logger.error(`Error getting JSON type from key ${key}:`, error)
      throw error
    }
  }

  async jsonNumIncrBy(key: string, path: string, value: number): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonNumIncrBy operation')
      return '0'
    }
    try {
      const result = await this.client.call('JSON.NUMINCRBY', key, path, value)
      return result as string
    } catch (error) {
      this.logger.error(`Error incrementing JSON number in key ${key}:`, error)
      throw error
    }
  }

  async jsonStrAppend(key: string, path: string, value: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonStrAppend operation')
      return 0
    }
    try {
      const result = await this.client.call('JSON.STRAPPEND', key, path, JSON.stringify(value))
      return result as number
    } catch (error) {
      this.logger.error(`Error appending to JSON string in key ${key}:`, error)
      throw error
    }
  }

  async jsonStrLen(key: string, path = '$'): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonStrLen operation')
      return 0
    }
    try {
      const result = await this.client.call('JSON.STRLEN', key, path)
      return result as number
    } catch (error) {
      this.logger.error(`Error getting JSON string length from key ${key}:`, error)
      throw error
    }
  }

  async jsonArrAppend(key: string, path: string, ...values: unknown[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonArrAppend operation')
      return 0
    }
    try {
      const jsonValues = values.map((v) => JSON.stringify(v))
      const result = await this.client.call('JSON.ARRAPPEND', key, path, ...jsonValues)
      return result as number
    } catch (error) {
      this.logger.error(`Error appending to JSON array in key ${key}:`, error)
      throw error
    }
  }

  async jsonArrLen(key: string, path = '$'): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonArrLen operation')
      return 0
    }
    try {
      const result = await this.client.call('JSON.ARRLEN', key, path)
      return result as number
    } catch (error) {
      this.logger.error(`Error getting JSON array length from key ${key}:`, error)
      throw error
    }
  }

  async jsonArrPop(key: string, path = '$', index = -1): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonArrPop operation')
      return null
    }
    try {
      const result = await this.client.call('JSON.ARRPOP', key, path, index)
      return result as string
    } catch (error) {
      this.logger.error(`Error popping from JSON array in key ${key}:`, error)
      throw error
    }
  }

  async jsonArrIndex(
    key: string,
    path: string,
    value: unknown,
    start?: number,
    stop?: number,
  ): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping jsonArrIndex operation')
      return -1
    }
    try {
      const args = [key, path, JSON.stringify(value)]
      if (start !== undefined) args.push(start.toString())
      if (stop !== undefined) args.push(stop.toString())

      const result = await this.client.call('JSON.ARRINDEX', ...args)
      return result as number
    } catch (error) {
      this.logger.error(`Error finding index in JSON array in key ${key}:`, error)
      throw error
    }
  }

  // Utility methods for easier JSON operations
  async setObject(key: string, obj: Record<string, unknown>, ttl?: number): Promise<void> {
    await this.jsonSet(key, '$', obj)
    if (ttl && this.client) {
      await this.client.expire(key, ttl)
    }
  }

  async getObject<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const result = await this.jsonGet(key)
    if (!result) return null

    try {
      // RedisJSON returns arrays for path queries, get first element
      const parsed: unknown = Array.isArray(result) ? result[0] : result
      return parsed as T
    } catch (error) {
      this.logger.error(`Error parsing JSON result for key ${key}:`, error)
      return null
    }
  }

  async updateObjectField(key: string, field: string, value: unknown): Promise<void> {
    await this.jsonSet(key, `$.${field}`, value)
  }

  async getObjectField<T = unknown>(key: string, field: string): Promise<T | null> {
    const result = await this.jsonGet(key, `$.${field}`)
    if (!result) return null

    try {
      const parsed: unknown = Array.isArray(result) ? result[0] : result
      return parsed as T
    } catch (error) {
      this.logger.error(`Error parsing JSON field result for key ${key}.${field}:`, error)
      return null
    }
  }
}
