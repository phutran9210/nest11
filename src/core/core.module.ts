import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '~core/database/database.module';
import { LoggerModule } from './logger/logger.module';
import { SecurityModule } from './security/security.module';
import { LifecycleModule } from '~core/lifecycle';
import { CorsService } from './config/cors.service';
import { MailerModule } from './mailer/mailer.module';

@Global()
@Module({
  imports: [DatabaseModule, LoggerModule, SecurityModule, LifecycleModule, MailerModule],
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
