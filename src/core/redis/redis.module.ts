import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisService } from './redis.service';
import { RedisHealthIndicator } from './redis-health.service';
import { RedisHealthController } from './redis-health.controller';
import { RedisLockService } from './services';

@Module({
  imports: [TerminusModule],
  controllers: [RedisHealthController],
  providers: [RedisService, RedisHealthIndicator, RedisLockService],
  exports: [RedisService, RedisHealthIndicator, RedisLockService],
})
export class RedisModule {}
