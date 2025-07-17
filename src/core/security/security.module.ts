import { Module } from '@nestjs/common'
import { RedisModule } from '~core/redis'
import { JwtBlacklistService } from './jwt-blacklist.service'
import { RateLimitService } from './rate-limit.service'

@Module({
  imports: [RedisModule],
  providers: [RateLimitService, JwtBlacklistService],
  exports: [RateLimitService, JwtBlacklistService],
})
export class SecurityModule {}
