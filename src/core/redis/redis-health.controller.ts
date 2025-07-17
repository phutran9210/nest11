import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { ApiSuccessResponse } from '~/core/decorators'
import { RedisHealthIndicator } from './redis-health.service'

@ApiTags('health')
@Controller('health')
export class RedisHealthController {
  private readonly health: HealthCheckService
  private readonly redisHealthIndicator: RedisHealthIndicator

  constructor(health: HealthCheckService, redisHealthIndicator: RedisHealthIndicator) {
    this.health = health
    this.redisHealthIndicator = redisHealthIndicator
  }

  @Get('redis')
  @HealthCheck()
  @ApiSuccessResponse({
    description: 'Redis health status',
    type: Object,
  })
  checkRedisHealth() {
    return this.health.check([() => this.redisHealthIndicator.isHealthy('redis')])
  }
}
