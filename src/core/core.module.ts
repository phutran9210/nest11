import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '~core/database/database.module'
import { LifecycleModule } from '~core/lifecycle'
import { CorsService } from '~core/config'
import { LoggerModule } from './logger/logger.module'
import { MailerModule } from '~core/mailer'
import { SecurityModule } from './security/security.module'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    LoggerModule,
    SecurityModule,
    LifecycleModule,
    MailerModule,
  ],
  providers: [CorsService],
  exports: [
    DatabaseModule,
    LoggerModule,
    SecurityModule,
    LifecycleModule,
    CorsService,
    MailerModule,
  ],
})
export class CoreModule {}
