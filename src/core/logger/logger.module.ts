import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { CustomLoggerService } from './logger.service';
import { loggerConfig } from '../config/logger.config';

@Global()
@Module({
  imports: [WinstonModule.forRootAsync(loggerConfig)],
  providers: [
    {
      provide: CustomLoggerService,
      useFactory: (winstonLogger: winston.Logger) => new CustomLoggerService(winstonLogger),
      inject: ['winston'],
    },
  ],
  exports: [CustomLoggerService],
})
export class LoggerModule {}
