import { ConfigService } from '@nestjs/config'
import * as winston from 'winston'
import * as DailyRotateFile from 'winston-daily-rotate-file'

interface LoggerConfigOptions {
  nodeEnv: string
  logLevel: string
  logDir: string
  enableFileLogging: boolean
}

const LOG_CONFIG = {
  DATE_PATTERN: 'YYYY-MM-DD',
  MAX_FILE_SIZE: {
    STANDARD: '20m',
    ACCESS: '50m',
  },
  RETENTION: {
    SHORT: '7d',
    MEDIUM: '14d',
    LONG: '30d',
  },
} as const

const createDevelopmentFormat = () => {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      const contextString = context ? `[${JSON.stringify(context)}]` : ''
      return `${String(timestamp)} ${String(level)} ${contextString} ${String(message)} ${metaString}`
    }),
  )
}

const createProductionFormat = () => {
  return winston.format.combine(winston.format.timestamp(), winston.format.json())
}

const createConsoleTransport = (nodeEnv: string): winston.transport => {
  const format = nodeEnv === 'development' ? createDevelopmentFormat() : createProductionFormat()
  return new winston.transports.Console({ format })
}

const createFileTransports = (logDir: string): winston.transport[] => {
  const jsonFormat = winston.format.combine(winston.format.timestamp(), winston.format.json())

  return [
    new DailyRotateFile({
      filename: `${logDir}/application-%DATE%.log`,
      datePattern: LOG_CONFIG.DATE_PATTERN,
      maxSize: LOG_CONFIG.MAX_FILE_SIZE.STANDARD,
      maxFiles: LOG_CONFIG.RETENTION.MEDIUM,
      format: jsonFormat,
    }),
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: LOG_CONFIG.DATE_PATTERN,
      level: 'error',
      maxSize: LOG_CONFIG.MAX_FILE_SIZE.STANDARD,
      maxFiles: LOG_CONFIG.RETENTION.LONG,
      format: jsonFormat,
    }),
    new DailyRotateFile({
      filename: `${logDir}/access-%DATE%.log`,
      datePattern: LOG_CONFIG.DATE_PATTERN,
      maxSize: LOG_CONFIG.MAX_FILE_SIZE.ACCESS,
      maxFiles: LOG_CONFIG.RETENTION.SHORT,
      format: jsonFormat,
    }),
  ]
}

const createExceptionHandlers = (
  logDir: string,
  enableFileLogging: boolean,
): winston.transport[] => {
  if (!enableFileLogging) return []

  return [
    new DailyRotateFile({
      filename: `${logDir}/exceptions-%DATE%.log`,
      datePattern: LOG_CONFIG.DATE_PATTERN,
      maxSize: LOG_CONFIG.MAX_FILE_SIZE.STANDARD,
      maxFiles: LOG_CONFIG.RETENTION.LONG,
    }),
  ]
}

const createRejectionHandlers = (
  logDir: string,
  enableFileLogging: boolean,
): winston.transport[] => {
  if (!enableFileLogging) return []

  return [
    new DailyRotateFile({
      filename: `${logDir}/rejections-%DATE%.log`,
      datePattern: LOG_CONFIG.DATE_PATTERN,
      maxSize: LOG_CONFIG.MAX_FILE_SIZE.STANDARD,
      maxFiles: LOG_CONFIG.RETENTION.LONG,
    }),
  ]
}

const getLoggerConfigOptions = (configService: ConfigService): LoggerConfigOptions => ({
  nodeEnv: configService.get<string>('NODE_ENV', 'development'),
  logLevel: configService.get<string>('LOG_LEVEL', 'info'),
  logDir: configService.get<string>('LOG_DIR', 'logs'),
  enableFileLogging: configService.get<string>('ENABLE_FILE_LOGGING', 'true') === 'true',
})

export const createWinstonConfig = (configService: ConfigService): winston.LoggerOptions => {
  const { nodeEnv, logLevel, logDir, enableFileLogging } = getLoggerConfigOptions(configService)

  const transports: winston.transport[] = [createConsoleTransport(nodeEnv)]

  if (enableFileLogging) {
    transports.push(...createFileTransports(logDir))
  }

  return {
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: 'nestjs-app' },
    transports,
    exceptionHandlers: createExceptionHandlers(logDir, enableFileLogging),
    rejectionHandlers: createRejectionHandlers(logDir, enableFileLogging),
  }
}

export const loggerConfig = {
  imports: [],
  useFactory: (configService: ConfigService) => createWinstonConfig(configService),
  inject: [ConfigService],
}
