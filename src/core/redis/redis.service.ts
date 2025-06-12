import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConnectionConfig } from '~core/config';
import {
  RedisStringService,
  RedisHashService,
  RedisListService,
  RedisSetService,
  RedisPubSubService,
  RedisUtilityService,
  RedisJsonService,
} from './services';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis | null = null;

  // Specialized services for different data types
  public readonly string: RedisStringService;
  public readonly hash: RedisHashService;
  public readonly list: RedisListService;
  public readonly sets: RedisSetService;
  public readonly pubsub: RedisPubSubService;
  public readonly utility: RedisUtilityService;
  public readonly json: RedisJsonService;

  constructor() {
    // Services will be updated when client is initialized
    this.string = new RedisStringService(this.client);
    this.hash = new RedisHashService(this.client);
    this.list = new RedisListService(this.client);
    this.sets = new RedisSetService(this.client);
    this.pubsub = new RedisPubSubService(this.client);
    this.utility = new RedisUtilityService(this.client);
    this.json = new RedisJsonService(this.client);
  }

  async onModuleInit() {
    try {
      // Create Redis connection with better error handling
      this.client = new Redis({
        ...redisConnectionConfig,
        enableOfflineQueue: true, // Allow queuing commands when offline
        lazyConnect: false, // Connect immediately
        connectTimeout: 5000, // 5 second timeout
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis connection error:', error.message);
      });

      this.client.on('ready', () => {
        this.logger.log('Redis is ready to accept commands');
      });

      this.client.on('close', () => {
        this.logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', (delay: number) => {
        this.logger.log(`Redis reconnecting in ${delay}ms...`);
      });

      // Test connection with timeout
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 5000)),
      ]);

      this.logger.log('Redis ping successful');

      // Update all sub-services with the connected client
      this.updateSubServicesClient();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis initialization failed:', errorMessage);
      this.logger.warn('Application will continue without Redis cache');

      // Create a mock client for graceful degradation
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      const currentClient = this.client;
      this.client = null; // Set to null immediately to prevent duplicate calls

      try {
        this.logger.log('🔄 Closing Redis connection...');

        // Check if connection is still active
        if (currentClient.status === 'ready' || currentClient.status === 'connecting') {
          // Remove all listeners to prevent memory leaks
          currentClient.removeAllListeners();

          // Gracefully quit the connection
          await Promise.race([
            currentClient.quit(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Redis quit timeout')), 3000),
            ),
          ]);
        }

        this.logger.log('✅ Redis connection closed gracefully');
      } catch (error) {
        this.logger.error('❌ Error closing Redis connection:', error);

        // Force disconnect if quit fails and client is not already closed
        try {
          if (currentClient.status !== 'end') {
            currentClient.disconnect();
            this.logger.warn('🔌 Redis connection force disconnected');
          }
        } catch {
          // Ignore disconnect errors as connection might already be closed
          this.logger.warn('⚠️ Redis already disconnected');
        }
      }
    }
  }

  beforeApplicationShutdown(signal?: string) {
    this.logger.log(`🔄 Redis service received shutdown signal: ${signal || 'unknown'}`);
  }

  private updateSubServicesClient(): void {
    // Update all sub-services with the current client
    (this.string as unknown as { client: unknown }).client = this.client;
    (this.hash as unknown as { client: unknown }).client = this.client;
    (this.list as unknown as { client: unknown }).client = this.client;
    (this.sets as unknown as { client: unknown }).client = this.client;
    (this.pubsub as unknown as { client: unknown }).client = this.client;
    (this.utility as unknown as { client: unknown }).client = this.client;
    (this.json as unknown as { client: unknown }).client = this.client;
  }

  // Legacy methods for backward compatibility - delegate to appropriate services
  async get(key: string): Promise<string | null> {
    return this.string.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    return this.string.set(key, value, ttl);
  }

  async del(key: string): Promise<number> {
    return this.utility.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.utility.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.utility.expire(key, seconds);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return this.hash.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.hash.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.hash.hgetall(key);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.list.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    return this.list.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.list.llen(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.list.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.sets.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.sets.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.sets.sismember(key, member);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.sets.srem(key, ...members);
  }

  // String operations
  async incr(key: string): Promise<number> {
    return this.string.incr(key);
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    return this.pubsub.publish(channel, message);
  }

  // Utility methods
  async flushdb(): Promise<string> {
    return this.utility.flushdb();
  }

  async ping(): Promise<string> {
    return this.utility.ping();
  }

  async keys(pattern: string): Promise<string[]> {
    return this.utility.keys(pattern);
  }

  // JSON operations (if Redis Stack is available)
  async jsonGet(key: string, path = '$'): Promise<unknown> {
    return this.json.jsonGet(key, path);
  }

  async jsonSet(key: string, path: string, value: unknown): Promise<string> {
    return this.json.jsonSet(key, path, value);
  }

  // Pipeline and transaction operations
  pipeline() {
    return this.utility.pipeline();
  }

  multi() {
    return this.utility.multi();
  }

  // Connection status
  isConnected(): boolean {
    return this.utility.isConnected();
  }

  getConnectionStatus(): string {
    return this.utility.getConnectionStatus();
  }

  // Direct client access for advanced operations
  getClient(): Redis | null {
    return this.client;
  }
}
