import { Module } from '@nestjs/common';
import { RedisModule } from '~core/redis';
import { RateLimitService } from './rate-limit.service';
import { JwtBlacklistService } from './jwt-blacklist.service';

@Module({
  imports: [RedisModule],
  providers: [RateLimitService, JwtBlacklistService],
  exports: [RateLimitService, JwtBlacklistService],
})
export class SecurityModule {}
