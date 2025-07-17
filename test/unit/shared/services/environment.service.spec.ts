import type { ConfigService } from '@nestjs/config'
import { EnvironmentService } from '~shared/services/environment.service'

describe('EnvironmentService', () => {
  let service: EnvironmentService
  let mockConfigService: jest.Mocked<ConfigService>

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any

    service = new EnvironmentService(mockConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('app', () => {
    it('should return app config with default values', () => {
      mockConfigService.get
        .mockReturnValueOnce('3000') // PORT
        .mockReturnValueOnce('development') // NODE_ENV
        .mockReturnValueOnce('api') // API_PREFIX

      const result = service.app

      expect(result).toEqual({
        port: 3000,
        nodeEnv: 'development',
        apiPrefix: 'api',
      })
      expect(mockConfigService.get).toHaveBeenCalledWith('PORT', '3000')
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV', 'development')
      expect(mockConfigService.get).toHaveBeenCalledWith('API_PREFIX', 'api')
    })

    it('should parse port as number', () => {
      mockConfigService.get
        .mockReturnValueOnce('8080')
        .mockReturnValueOnce('production')
        .mockReturnValueOnce('v1')

      const result = service.app

      expect(result.port).toBe(8080)
      expect(typeof result.port).toBe('number')
    })
  })

  describe('database', () => {
    it('should return database config with default values', () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost') // DB_HOST
        .mockReturnValueOnce('5432') // DB_PORT
        .mockReturnValueOnce('postgres') // DB_USERNAME
        .mockReturnValueOnce('password') // DB_PASSWORD
        .mockReturnValueOnce('nestjs_db') // DB_NAME
        .mockReturnValueOnce('false') // DB_SYNCHRONIZE
        .mockReturnValueOnce('false') // DB_LOGGING

      const result = service.database

      expect(result).toEqual({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'password',
        database: 'nestjs_db',
        synchronize: false,
        logging: false,
      })
    })

    it('should parse boolean values correctly', () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost')
        .mockReturnValueOnce('5432')
        .mockReturnValueOnce('postgres')
        .mockReturnValueOnce('password')
        .mockReturnValueOnce('nestjs_db')
        .mockReturnValueOnce('true') // DB_SYNCHRONIZE
        .mockReturnValueOnce('true') // DB_LOGGING

      const result = service.database

      expect(result.synchronize).toBe(true)
      expect(result.logging).toBe(true)
    })

    it('should parse port as number', () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost')
        .mockReturnValueOnce('3306')
        .mockReturnValueOnce('root')
        .mockReturnValueOnce('password')
        .mockReturnValueOnce('mydb')
        .mockReturnValueOnce('false')
        .mockReturnValueOnce('false')

      const result = service.database

      expect(result.port).toBe(3306)
      expect(typeof result.port).toBe('number')
    })
  })

  describe('security', () => {
    it('should return security config with default values', () => {
      mockConfigService.get
        .mockReturnValueOnce('10') // BCRYPT_SALT_ROUNDS
        .mockReturnValueOnce('your-secret-key') // JWT_SECRET
        .mockReturnValueOnce('7d') // JWT_EXPIRES_IN
        .mockReturnValueOnce('http://localhost:3000') // CORS_ORIGIN

      const result = service.security

      expect(result).toEqual({
        saltRounds: 10,
        jwtSecret: 'your-secret-key',
        jwtExpiresIn: '7d',
        corsOrigin: ['http://localhost:3000'],
      })
    })

    it('should parse saltRounds as number', () => {
      mockConfigService.get
        .mockReturnValueOnce('12')
        .mockReturnValueOnce('secret')
        .mockReturnValueOnce('1d')
        .mockReturnValueOnce('http://localhost:3000')

      const result = service.security

      expect(result.saltRounds).toBe(12)
      expect(typeof result.saltRounds).toBe('number')
    })

    it('should handle multiple CORS origins', () => {
      mockConfigService.get
        .mockReturnValueOnce('10')
        .mockReturnValueOnce('secret')
        .mockReturnValueOnce('7d')
        .mockReturnValueOnce('http://localhost:3000,https://example.com,http://192.168.1.1:3000')

      const result = service.security

      expect(result.corsOrigin).toEqual([
        'http://localhost:3000',
        'https://example.com',
        'http://192.168.1.1:3000',
      ])
    })

    it('should trim CORS origins', () => {
      mockConfigService.get
        .mockReturnValueOnce('10')
        .mockReturnValueOnce('secret')
        .mockReturnValueOnce('7d')
        .mockReturnValueOnce('http://localhost:3000 , https://example.com , http://test.com')

      const result = service.security

      expect(result.corsOrigin).toEqual([
        'http://localhost:3000',
        'https://example.com',
        'http://test.com',
      ])
    })
  })

  describe('logging', () => {
    it('should return logging config with default values', () => {
      mockConfigService.get
        .mockReturnValueOnce('info') // LOG_LEVEL
        .mockReturnValueOnce('logs') // LOG_DIR
        .mockReturnValueOnce('true') // ENABLE_FILE_LOGGING

      const result = service.logging

      expect(result).toEqual({
        level: 'info',
        dir: 'logs',
        enableFileLogging: true,
      })
    })

    it('should parse enableFileLogging as boolean', () => {
      mockConfigService.get
        .mockReturnValueOnce('debug')
        .mockReturnValueOnce('/var/logs')
        .mockReturnValueOnce('false')

      const result = service.logging

      expect(result.enableFileLogging).toBe(false)
    })
  })

  describe('all', () => {
    it('should return all configurations', () => {
      // Mock all the calls for each config section
      mockConfigService.get
        // app config
        .mockReturnValueOnce('3000')
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('api')
        // database config
        .mockReturnValueOnce('localhost')
        .mockReturnValueOnce('5432')
        .mockReturnValueOnce('postgres')
        .mockReturnValueOnce('password')
        .mockReturnValueOnce('nestjs_db')
        .mockReturnValueOnce('false')
        .mockReturnValueOnce('false')
        // security config
        .mockReturnValueOnce('10')
        .mockReturnValueOnce('your-secret-key')
        .mockReturnValueOnce('7d')
        .mockReturnValueOnce('http://localhost:3000')
        // logging config
        .mockReturnValueOnce('info')
        .mockReturnValueOnce('logs')
        .mockReturnValueOnce('true')

      const result = service.all

      expect(result).toHaveProperty('app')
      expect(result).toHaveProperty('database')
      expect(result).toHaveProperty('security')
      expect(result).toHaveProperty('logging')
    })
  })

  describe('environment checks', () => {
    beforeEach(() => {
      // Default setup for app config
      mockConfigService.get
        .mockReturnValueOnce('3000')
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('api')
    })

    it('should return true for isDevelopment', () => {
      const result = service.isDevelopment()
      expect(result).toBe(true)
    })

    it('should return false for isProduction in development', () => {
      const result = service.isProduction()
      expect(result).toBe(false)
    })

    it('should return false for isTest in development', () => {
      const result = service.isTest()
      expect(result).toBe(false)
    })

    it('should return true for isProduction in production', () => {
      // Create new service with production environment
      jest.clearAllMocks()
      const productionConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'NODE_ENV') return 'production'
          return defaultValue
        }),
      } as any

      const productionService = new EnvironmentService(productionConfigService)
      const result = productionService.isProduction()
      expect(result).toBe(true)
    })

    it('should return true for isTest in test environment', () => {
      // Create new service with test environment
      jest.clearAllMocks()
      const testConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'NODE_ENV') return 'test'
          return defaultValue
        }),
      } as any

      const testService = new EnvironmentService(testConfigService)
      const result = testService.isTest()
      expect(result).toBe(true)
    })
  })

  describe('getRequiredString', () => {
    it('should return value when present', () => {
      mockConfigService.get.mockReturnValue('test-value')

      const result = service.getRequiredString('TEST_VAR')

      expect(result).toBe('test-value')
      expect(mockConfigService.get).toHaveBeenCalledWith('TEST_VAR')
    })

    it('should throw error when value is missing', () => {
      mockConfigService.get.mockReturnValue(undefined)

      expect(() => service.getRequiredString('MISSING_VAR')).toThrow(
        'Required environment variable MISSING_VAR is not defined',
      )
    })

    it('should throw error when value is empty string', () => {
      mockConfigService.get.mockReturnValue('')

      expect(() => service.getRequiredString('EMPTY_VAR')).toThrow(
        'Required environment variable EMPTY_VAR is not defined',
      )
    })
  })

  describe('getRequiredNumber', () => {
    it('should return number when present', () => {
      mockConfigService.get.mockReturnValue(42)

      const result = service.getRequiredNumber('TEST_NUMBER')

      expect(result).toBe(42)
      expect(mockConfigService.get).toHaveBeenCalledWith('TEST_NUMBER')
    })

    it('should throw error when value is undefined', () => {
      mockConfigService.get.mockReturnValue(undefined)

      expect(() => service.getRequiredNumber('MISSING_NUMBER')).toThrow(
        'Required environment variable MISSING_NUMBER is not defined',
      )
    })

    it('should throw error when value is null', () => {
      mockConfigService.get.mockReturnValue(null)

      expect(() => service.getRequiredNumber('NULL_NUMBER')).toThrow(
        'Required environment variable NULL_NUMBER is not defined',
      )
    })

    it('should return 0 when value is 0', () => {
      mockConfigService.get.mockReturnValue(0)

      const result = service.getRequiredNumber('ZERO_NUMBER')

      expect(result).toBe(0)
    })
  })

  describe('validateRequiredVars', () => {
    it('should not throw when all required variables are present', () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost') // DB_HOST
        .mockReturnValueOnce('5432') // DB_PORT
        .mockReturnValueOnce('postgres') // DB_USERNAME
        .mockReturnValueOnce('password') // DB_PASSWORD
        .mockReturnValueOnce('nestjs_db') // DB_NAME

      expect(() => service.validateRequiredVars()).not.toThrow()
    })

    it('should throw error when required variables are missing', () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost') // DB_HOST
        .mockReturnValueOnce(undefined) // DB_PORT - missing
        .mockReturnValueOnce('postgres') // DB_USERNAME
        .mockReturnValueOnce(undefined) // DB_PASSWORD - missing
        .mockReturnValueOnce('nestjs_db') // DB_NAME

      expect(() => service.validateRequiredVars()).toThrow(
        'Missing required environment variables: DB_PORT, DB_PASSWORD',
      )
    })

    it('should throw error when all required variables are missing', () => {
      mockConfigService.get.mockReturnValue(undefined)

      expect(() => service.validateRequiredVars()).toThrow(
        'Missing required environment variables: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME',
      )
    })
  })
})
