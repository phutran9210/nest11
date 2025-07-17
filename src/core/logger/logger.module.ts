import { Global, Module } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import { loggerConfig } from '~core/config'
import { CustomLoggerService } from './logger.service'

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
