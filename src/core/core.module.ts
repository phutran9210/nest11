import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '~core/database/database.module';
import { LoggerModule } from './logger/logger.module';
import { SecurityModule } from './security/security.module';
import { LifecycleModule } from '~core/lifecycle';

@Global()
@Module({
  imports: [DatabaseModule, LoggerModule, SecurityModule, LifecycleModule],
  providers: [],
  exports: [DatabaseModule, LoggerModule, SecurityModule, LifecycleModule],
})
export class CoreModule {}
