import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from '~core/core.module';
import { SharedModule } from '~shared/shared.module';
import { UserModule } from '~modules/user/user.module';
import { AuthModule } from '~modules/auth/auth.module';
import { RbacModule } from '~modules/rbac/rbac.module';
import { WebSocketModule } from '~modules/websocket';
import { LoggingInterceptor } from '~core/interceptors/logging.interceptor';
import { JwtAuthGuard } from '~core/guards';
import { RedisCacheModule } from '~core/cache';
import { RedisModule } from '~core/redis';
import mailerConfig from '~core/config/mailer.config';

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
