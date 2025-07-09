import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '~core/database/database.module';
import { LoggerModule } from './logger/logger.module';
import { SecurityModule } from './security/security.module';
import { LifecycleModule } from '~core/lifecycle';
import { CorsService } from './config/cors.service';

@Global()
@Module({
  imports: [DatabaseModule, LoggerModule, SecurityModule, LifecycleModule],
  providers: [CorsService],
  exports: [DatabaseModule, LoggerModule, SecurityModule, LifecycleModule, CorsService],
})
export class CoreModule {}
