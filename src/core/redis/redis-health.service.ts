import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly redisService: RedisService;

  constructor(redisService: RedisService) {
    super();
    this.redisService = redisService;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const start = Date.now();
      await this.redisService.ping();
      const duration = Date.now() - start;

      const result = this.getStatus(key, true, {
        status: 'up',
        responseTime: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        status: 'down',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
      });

      throw new HealthCheckError('Redis health check failed', result);
    }
  }
}
