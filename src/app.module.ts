import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { RedisCacheModule } from '~core/cache'
import mailerConfig from '~core/config/mailer.config'
import { CoreModule } from '~core/core.module'
import { JwtAuthGuard } from '~core/guards'
import { LoggingInterceptor } from '~core/interceptors/logging.interceptor'
import { RedisModule } from '~core/redis'
import { AuthModule } from '~modules/auth/auth.module'
import { RbacModule } from '~modules/rbac/rbac.module'
import { UserModule } from '~modules/user/user.module'
import { WebSocketModule } from '~modules/websocket'
import { SharedModule } from '~shared/shared.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [mailerConfig],
    }),
    RedisCacheModule,
    RedisModule,
    SharedModule,
    CoreModule,
    UserModule,
    AuthModule,
    RbacModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
