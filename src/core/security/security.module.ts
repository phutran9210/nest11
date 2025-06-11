import { Module } from '@nestjs/common';
import { RedisModule } from '~core/redis';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [RedisModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class SecurityModule {}
