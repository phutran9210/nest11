import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { RedisService } from './redis.service'
import { RedisHealthController } from './redis-health.controller'
import { RedisHealthIndicator } from './redis-health.service'
import {
  RedisHashService,
  RedisJsonService,
  RedisListService,
  RedisLockService,
  RedisPubSubService,
  RedisSetService,
  RedisStringService,
  RedisUtilityService,
} from './services'

@Module({
  imports: [TerminusModule],
  controllers: [RedisHealthController],
  providers: [
    RedisService,
    RedisHealthIndicator,
    {
      provide: RedisStringService,
      useFactory: (redisService: RedisService) => {
        return new RedisStringService(redisService.getClient())
      },
      inject: [RedisService],
    },
    {
      provide: RedisHashService,
      useFactory: (redisService: RedisService) => {
        return new RedisHashService(redisService.getClient())
      },
      inject: [RedisService],
    },
    {
      provide: RedisListService,
      useFactory: (redisService: RedisService) => {
        return new RedisListService(redisService.getClient())
      },
      inject: [RedisService],
    },
    {
      provide: RedisSetService,
      useFactory: (redisService: RedisService) => {
        return new RedisSetService(redisService.getClient())
      },
      inject: [RedisService],
    },
    {
      provide: RedisLockService,
      useFactory: (redisService: RedisService) => {
        return new RedisLockService(redisService)
      },
      inject: [RedisService],
    },
    {
      provide: RedisPubSubService,
      useFactory: (redisService: RedisService) => {
        return new RedisPubSubService(redisService.getClient())
      },
      inject: [RedisService],
    },
    {
      provide: RedisUtilityService,
      useFactory: (redisService: RedisService) => {
        return new RedisUtilityService(redisService.getClient())
      },
      inject: [RedisService],
    },
    {
      provide: RedisJsonService,
      useFactory: (redisService: RedisService) => {
        return new RedisJsonService(redisService.getClient())
      },
      inject: [RedisService],
    },
  ],
  exports: [
    RedisService,
    RedisHealthIndicator,
    RedisStringService,
    RedisHashService,
    RedisListService,
    RedisSetService,
    RedisLockService,
    RedisPubSubService,
    RedisUtilityService,
    RedisJsonService,
  ],
})
export class RedisModule {}
