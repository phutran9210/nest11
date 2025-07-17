import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from '~core/redis'
import { UserEntity } from '~shared/entities/user.entity'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserCacheService } from './user-cache.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RedisModule],
  controllers: [UserController],
  providers: [UserService, UserCacheService],
  exports: [UserService, UserCacheService],
})
export class UserModule {}
