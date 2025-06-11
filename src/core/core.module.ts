import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '~core/database/database.module';
import { LoggerModule } from './logger/logger.module';
import { LifecycleModule } from '~core/lifecycle';

@Global()
@Module({
  imports: [DatabaseModule, LoggerModule, LifecycleModule],
  providers: [],
  exports: [DatabaseModule, LoggerModule, LifecycleModule],
})
export class CoreModule {}
