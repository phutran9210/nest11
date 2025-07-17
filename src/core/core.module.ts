import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CorsService } from '~core/config'
import { DatabaseModule } from '~core/database/database.module'
import { LifecycleModule } from '~core/lifecycle'
import { MailerModule } from '~core/mailer'
import { LoggerModule } from './logger/logger.module'
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
