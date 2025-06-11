import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisStringService {
  private readonly logger = new Logger(RedisStringService.name);
  private readonly client: Redis | null;

  constructor(client: Redis | null) {
    this.client = client;
  }

  // Basic string operations
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping get operation');
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping set operation');
      return;
    }
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping setex operation');
      return;
    }
    try {
      await this.client.setex(key, seconds, value);
    } catch (error) {
      this.logger.error(`Error setting key ${key} with expiration:`, error);
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping incr operation');
      return 0;
    }
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping decr operation');
      return 0;
    }
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping incrby operation');
      return 0;
    }
    try {
      return await this.client.incrby(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} by ${increment}:`, error);
      throw error;
    }
  }

  async append(key: string, value: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping append operation');
      return 0;
    }
    try {
      return await this.client.append(key, value);
    } catch (error) {
      this.logger.error(`Error appending to key ${key}:`, error);
      throw error;
    }
  }

  async strlen(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping strlen operation');
      return 0;
    }
    try {
      return await this.client.strlen(key);
    } catch (error) {
      this.logger.error(`Error getting length of key ${key}:`, error);
      throw error;
    }
  }
}
