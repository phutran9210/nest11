import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';
import { RedisOptions } from 'ioredis';

export const redisConnectionConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  username: process.env.REDIS_USERNAME,

  // Connection options
  connectTimeout: 10000,
  lazyConnect: true,
  enableOfflineQueue: false,

  // Connection pool
  family: 4,
  keepAlive: 30000,

  // Reconnection
  maxRetriesPerRequest: 3,

  // Cluster support (if needed)
  enableReadyCheck: true,
};

export const redisConfig = (): CacheModuleOptions => ({
  store: redisStore,
  ttl: parseInt(process.env.CACHE_TTL || '300', 10) * 1000, // Convert to milliseconds
  max: parseInt(process.env.CACHE_MAX || '1000', 10),
  ...redisConnectionConfig,
});
