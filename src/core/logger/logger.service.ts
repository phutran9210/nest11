import { Injectable, type LoggerService, type OnModuleDestroy } from '@nestjs/common'
import type * as winston from 'winston'

@Injectable()
export class CustomLoggerService implements LoggerService, OnModuleDestroy {
  private readonly logger: winston.Logger
  private isClosing = false

  constructor(logger: winston.Logger) {
    this.logger = logger
  }

  async onModuleDestroy() {
    if (this.isClosing) return // Prevent duplicate close calls
    this.isClosing = true

    try {
      console.log('🔄 Closing Winston logger...')

      // Close all transports gracefully with timeout
      await Promise.race([
        new Promise<void>((resolve) => {
          this.logger.end(() => {
            console.log('✅ Winston logger closed gracefully')
            resolve()
          })
        }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Logger close timeout')), 3000),
        ),
      ])
    } catch (error) {
      console.error('❌ Error closing Winston logger:', error)

      // Force close logger if graceful close fails
      try {
        this.logger.destroy()
        console.log('🔌 Winston logger force closed')
      } catch (forceError) {
        console.error('❌ Error force closing logger:', forceError)
      }
    }
  }

  beforeApplicationShutdown(signal?: string) {
    // Don't log to winston during shutdown to prevent "write after end" errors
    console.log(`⏹️ Logger service received shutdown signal: ${signal || 'unknown'}`)
  }

  log(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, { context, ...optionalParams })
  }

  error(message: string, trace?: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.error(message, { trace, context, ...optionalParams })
  }

  warn(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.warn(message, { context, ...optionalParams })
  }

  debug(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.debug(message, { context, ...optionalParams })
  }

  verbose(message: string, context?: string, ...optionalParams: unknown[]): void {
    this.logger.verbose(message, { context, ...optionalParams })
  }

  // Additional methods for specific use cases
  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta)
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.logger.http(message, meta)
  }

  // Method for structured logging
  logWithMeta(level: string, message: string, meta: Record<string, unknown>): void {
    this.logger.log(level, message, meta)
  }

  // Database operation logging
  logDatabase(operation: string, table: string, duration?: number, error?: Error): void {
    const meta = {
      operation,
      table,
      duration,
      error: error?.message,
      stack: error?.stack,
    }

    if (error) {
      this.logger.error(`Database operation failed: ${operation} on ${table}`, meta)
    } else {
      this.logger.info(`Database operation: ${operation} on ${table}`, meta)
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
    }

    if (statusCode >= 400) {
      this.logger.warn(`HTTP ${statusCode}: ${method} ${url}`, meta)
    } else {
      this.logger.http(`HTTP ${statusCode}: ${method} ${url}`, meta)
    }
  }

  // Application lifecycle logging
  logStartup(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(`🚀 ${message}`, { ...meta, lifecycle: 'startup' })
  }

  logShutdown(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(`⏹️ ${message}`, { ...meta, lifecycle: 'shutdown' })
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
    })
  }
}
