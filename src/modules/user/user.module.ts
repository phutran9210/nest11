import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserCacheService } from './user-cache.service';
import { UserEntity } from '~shared/entities/user.entity';
import { RedisModule } from '~core/redis';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RedisModule],
  controllers: [UserController],
  providers: [UserService, UserCacheService],
  exports: [UserService, UserCacheService],
})
export class UserModule {}
