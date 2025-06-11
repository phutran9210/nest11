import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisConfig } from '~core/config';

@Module({
  imports: [
    CacheModule.register({
      ...redisConfig(),
      isGlobal: true,
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
