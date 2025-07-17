import type * as winston from 'winston'
import { CustomLoggerService } from '~core/logger/logger.service'

describe('CustomLoggerService', () => {
  let service: CustomLoggerService
  let mockWinstonLogger: jest.Mocked<winston.Logger>

  beforeEach(() => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      http: jest.fn(),
      log: jest.fn(),
    } as any

    service = new CustomLoggerService(mockWinstonLogger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('log', () => {
    it('should call winston logger info with correct parameters', () => {
      const message = 'Test message'
      const context = 'TestContext'

      service.log(message, context)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        context,
      })
    })

    it('should handle optional parameters', () => {
      const message = 'Test message'
      const context = 'TestContext'
      const extra = { key: 'value' }

      service.log(message, context, extra)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        context,
        0: extra,
      })
    })
  })

  describe('error', () => {
    it('should call winston logger error with correct parameters', () => {
      const message = 'Error message'
      const trace = 'Error trace'
      const context = 'TestContext'

      service.error(message, trace, context)

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        trace,
        context,
      })
    })
  })

  describe('warn', () => {
    it('should call winston logger warn with correct parameters', () => {
      const message = 'Warning message'
      const context = 'TestContext'

      service.warn(message, context)

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, {
        context,
      })
    })
  })

  describe('debug', () => {
    it('should call winston logger debug with correct parameters', () => {
      const message = 'Debug message'
      const context = 'TestContext'

      service.debug(message, context)

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, {
        context,
      })
    })
  })

  describe('verbose', () => {
    it('should call winston logger verbose with correct parameters', () => {
      const message = 'Verbose message'
      const context = 'TestContext'

      service.verbose(message, context)

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, {
        context,
      })
    })
  })

  describe('info', () => {
    it('should call winston logger info with metadata', () => {
      const message = 'Info message'
      const meta = { key: 'value' }

      service.info(message, meta)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, meta)
    })
  })

  describe('http', () => {
    it('should call winston logger http with metadata', () => {
      const message = 'HTTP message'
      const meta = { method: 'GET', url: '/test' }

      service.http(message, meta)

      expect(mockWinstonLogger.http).toHaveBeenCalledWith(message, meta)
    })
  })

  describe('logWithMeta', () => {
    it('should call winston logger log with level and metadata', () => {
      const level = 'info'
      const message = 'Message with meta'
      const meta = { key: 'value' }

      service.logWithMeta(level, message, meta)

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(level, message, meta)
    })
  })

  describe('logDatabase', () => {
    it('should log successful database operation', () => {
      const operation = 'SELECT'
      const table = 'users'
      const duration = 100

      service.logDatabase(operation, table, duration)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Database operation: ${operation} on ${table}`,
        {
          operation,
          table,
          duration,
          error: undefined,
          stack: undefined,
        },
      )
    })

    it('should log failed database operation with error', () => {
      const operation = 'INSERT'
      const table = 'users'
      const duration = 50
      const error = new Error('Database error')

      service.logDatabase(operation, table, duration, error)

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        `Database operation failed: ${operation} on ${table}`,
        {
          operation,
          table,
          duration,
          error: error.message,
          stack: error.stack,
        },
      )
    })
  })

  describe('logRequest', () => {
    it('should log successful HTTP request', () => {
      const method = 'GET'
      const url = '/api/users'
      const statusCode = 200
      const duration = 150
      const userAgent = 'test-agent'

      service.logRequest(method, url, statusCode, duration, userAgent)

      expect(mockWinstonLogger.http).toHaveBeenCalledWith(`HTTP ${statusCode}: ${method} ${url}`, {
        method,
        url,
        statusCode,
        duration,
        userAgent,
      })
    })

    it('should log failed HTTP request with warning', () => {
      const method = 'POST'
      const url = '/api/users'
      const statusCode = 400
      const duration = 100
      const userAgent = 'test-agent'

      service.logRequest(method, url, statusCode, duration, userAgent)

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(`HTTP ${statusCode}: ${method} ${url}`, {
        method,
        url,
        statusCode,
        duration,
        userAgent,
      })
    })
  })

  describe('logStartup', () => {
    it('should log startup message with emoji', () => {
      const message = 'Application started'
      const meta = { port: 3000 }

      service.logStartup(message, meta)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(`🚀 ${message}`, {
        ...meta,
        lifecycle: 'startup',
      })
    })
  })

  describe('logShutdown', () => {
    it('should log shutdown message with emoji', () => {
      const message = 'Application stopped'
      const meta = { graceful: true }

      service.logShutdown(message, meta)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(`⏹️ ${message}`, {
        ...meta,
        lifecycle: 'shutdown',
      })
    })
  })

  describe('logBusiness', () => {
    it('should log business action with entity ID', () => {
      const action = 'create'
      const entity = 'user'
      const entityId = '123'
      const meta = { email: 'test@example.com' }

      service.logBusiness(action, entity, entityId, meta)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Business action: ${action} on ${entity}`,
        {
          action,
          entity,
          entityId,
          ...meta,
        },
      )
    })

    it('should log business action without entity ID', () => {
      const action = 'list'
      const entity = 'users'

      service.logBusiness(action, entity)

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Business action: ${action} on ${entity}`,
        {
          action,
          entity,
          entityId: undefined,
        },
      )
    })
  })
})
