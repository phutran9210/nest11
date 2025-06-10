import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  log(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, { context, ...optionalParams });
  }

  error(message: string, trace?: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.error(message, { trace, context, ...optionalParams });
  }

  warn(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.warn(message, { context, ...optionalParams });
  }

  debug(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.debug(message, { context, ...optionalParams });
  }

  verbose(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.verbose(message, { context, ...optionalParams });
  }

  // Additional methods for specific use cases
  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.logger.http(message, meta);
  }

  // Method for structured logging
  logWithMeta(level: string, message: string, meta: Record<string, unknown>): void {
    this.logger.log(level, message, meta);
  }

  // Database operation logging
  logDatabase(operation: string, table: string, duration?: number, error?: Error): void {
    const meta = {
      operation,
      table,
      duration,
      error: error?.message,
      stack: error?.stack,
    };

    if (error) {
      this.logger.error(`Database operation failed: ${operation} on ${table}`, meta);
    } else {
      this.logger.info(`Database operation: ${operation} on ${table}`, meta);
    }
  }

  // HTTP request logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userAgent?: string,
  ): void {
    const meta = {
      method,
      url,
      statusCode,
      duration,
      userAgent,
    };

    if (statusCode >= 400) {
      this.logger.warn(`HTTP ${statusCode}: ${method} ${url}`, meta);
    } else {
      this.logger.http(`HTTP ${statusCode}: ${method} ${url}`, meta);
    }
  }

  // Application lifecycle logging
  logStartup(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(`🚀 ${message}`, { ...meta, lifecycle: 'startup' });
  }

  logShutdown(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(`⏹️ ${message}`, { ...meta, lifecycle: 'shutdown' });
  }

  // Business logic logging
  logBusiness(
    action: string,
    entity: string,
    entityId?: string | number,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.info(`Business action: ${action} on ${entity}`, {
      action,
      entity,
      entityId,
      ...meta,
    });
  }
}
