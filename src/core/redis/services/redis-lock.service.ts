import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';

export interface LockOptions {
  ttl?: number; // TTL in seconds, default 30
  retryDelay?: number; // Retry delay in ms, default 100
  retryCount?: number; // Max retry attempts, default 10
}

@Injectable()
export class RedisLockService {
  // eslint-disable-next-line @typescript-eslint/parameter-properties
  constructor(private readonly redisService: RedisService) {}

  async acquireLock(
    key: string,
    options: LockOptions = {},
  ): Promise<{ success: boolean; lockValue?: string }> {
    const { ttl = 30, retryDelay = 100, retryCount = 10 } = options;
    const lockKey = `lock:${key}`;
    const lockValue = `${Date.now()}-${Math.random()}`;

    for (let i = 0; i < retryCount; i++) {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client is not available');
      }

      const result = await client.set(lockKey, lockValue, 'PX', ttl * 1000, 'NX');

      if (result === 'OK') {
        return { success: true, lockValue };
      }

      if (i < retryCount - 1) {
        await this.sleep(retryDelay);
      }
    }

    return { success: false };
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const client = this.redisService.getClient();
    if (!client) {
      throw new Error('Redis client is not available');
    }

    const result = (await client.eval(luaScript, 1, lockKey, lockValue)) as number;
    return result === 1;
  }

  async withLock<T>(key: string, fn: () => Promise<T>, options: LockOptions = {}): Promise<T> {
    const lockResult = await this.acquireLock(key, options);

    if (!lockResult.success) {
      throw new Error(`Failed to acquire lock for key: ${key}`);
    }

    try {
      return await fn();
    } finally {
      if (lockResult.lockValue) {
        await this.releaseLock(key, lockResult.lockValue);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
