import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisHashService {
  private readonly logger = new Logger(RedisHashService.name);
  private readonly client: Redis | null;

  constructor(client: Redis | null) {
    this.client = client;
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hget operation');
      return null;
    }
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from key ${key}:`, error);
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hset operation');
      return 0;
    }
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} in key ${key}:`, error);
      throw error;
    }
  }

  async hmset(key: string, data: Record<string, string>): Promise<string> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hmset operation');
      return 'OK';
    }
    try {
      return await this.client.hmset(key, data);
    } catch (error) {
      this.logger.error(`Error setting multiple hash fields in key ${key}:`, error);
      throw error;
    }
  }

  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hmget operation');
      return [];
    }
    try {
      return await this.client.hmget(key, ...fields);
    } catch (error) {
      this.logger.error(`Error getting multiple hash fields from key ${key}:`, error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hgetall operation');
      return {};
    }
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields from key ${key}:`, error);
      throw error;
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hdel operation');
      return 0;
    }
    try {
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      this.logger.error(`Error deleting hash fields from key ${key}:`, error);
      throw error;
    }
  }

  async hexists(key: string, field: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hexists operation');
      return 0;
    }
    try {
      return await this.client.hexists(key, field);
    } catch (error) {
      this.logger.error(`Error checking hash field ${field} existence in key ${key}:`, error);
      throw error;
    }
  }

  async hlen(key: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hlen operation');
      return 0;
    }
    try {
      return await this.client.hlen(key);
    } catch (error) {
      this.logger.error(`Error getting hash length for key ${key}:`, error);
      throw error;
    }
  }

  async hkeys(key: string): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hkeys operation');
      return [];
    }
    try {
      return await this.client.hkeys(key);
    } catch (error) {
      this.logger.error(`Error getting hash keys for key ${key}:`, error);
      throw error;
    }
  }

  async hvals(key: string): Promise<string[]> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hvals operation');
      return [];
    }
    try {
      return await this.client.hvals(key);
    } catch (error) {
      this.logger.error(`Error getting hash values for key ${key}:`, error);
      throw error;
    }
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping hincrby operation');
      return 0;
    }
    try {
      return await this.client.hincrby(key, field, increment);
    } catch (error) {
      this.logger.error(`Error incrementing hash field ${field} in key ${key}:`, error);
      throw error;
    }
  }
}
