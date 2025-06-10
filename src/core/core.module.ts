import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '~core/database/database.module';
import { LoggerModule } from './logger/logger.module';

@Global()
@Module({
  imports: [DatabaseModule, LoggerModule],
  providers: [],
  exports: [DatabaseModule, LoggerModule],
})
export class CoreModule {}
