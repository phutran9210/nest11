import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { SecurityModule } from '~core/security/security.module'
import { UserModule } from '~modules/user/user.module'
// import { RedisModule } from '~core/redis/redis.module';
import { EnvironmentService } from '~shared/services'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    UserModule,
    SecurityModule,
    // RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (environmentService: EnvironmentService) => ({
        secret: environmentService.security.jwtSecret,
        signOptions: {
          expiresIn: environmentService.security.jwtExpiresIn,
        },
      }),
      inject: [EnvironmentService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
