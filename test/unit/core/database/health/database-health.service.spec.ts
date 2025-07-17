import { Test, type TestingModule } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { DatabaseHealthService, type IDatabaseHealthStatus } from '~core/database/health'

describe('DatabaseHealthService', () => {
  let service: DatabaseHealthService
  let dataSource: DataSource

  const mockDataSource = {
    isInitialized: true,
    options: {
      database: 'test_db',
      host: 'localhost',
      port: 5432,
    },
    query: jest.fn(),
    manager: {
      connection: {
        pool: {
          totalCount: 10,
          idleCount: 5,
          waitingCount: 0,
        },
      },
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile()

    service = module.get<DatabaseHealthService>(DatabaseHealthService)
    dataSource = module.get<DataSource>(DataSource)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('checkHealth', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1050)
    })

    it('should return healthy status when database is connected', async () => {
      mockDataSource.query.mockResolvedValue([{ result: 1 }])

      const result: IDatabaseHealthStatus = await service.checkHealth()

      expect(result).toEqual({
        status: 'healthy',
        isConnected: true,
        responseTime: 50,
        details: {
          database: 'test_db',
          host: 'localhost',
          port: 5432,
          connectionCount: 10,
        },
      })
    })

    it('should return unhealthy status when database query fails', async () => {
      const error = new Error('Connection failed')
      mockDataSource.query.mockRejectedValue(error)

      const result: IDatabaseHealthStatus = await service.checkHealth()

      expect(result).toEqual({
        status: 'unhealthy',
        isConnected: false,
        responseTime: 50,
        error: 'Connection failed',
        details: {
          database: 'test_db',
          host: 'localhost',
          port: 5432,
        },
      })
    })

    it('should handle dataSource not initialized', async () => {
      const uninitializedDataSource = {
        ...mockDataSource,
        isInitialized: false,
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatabaseHealthService,
          {
            provide: DataSource,
            useValue: uninitializedDataSource,
          },
        ],
      }).compile()

      const testService = module.get<DatabaseHealthService>(DatabaseHealthService)
      uninitializedDataSource.query.mockRejectedValue(new Error('DataSource not initialized'))

      const result = await testService.checkHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.isConnected).toBe(false)
      expect(result.error).toBe('DataSource not initialized')
    })

    it('should measure response time correctly', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(2000).mockReturnValueOnce(2100)

      mockDataSource.query.mockResolvedValue([{ result: 1 }])

      const result = await service.checkHealth()

      expect(result.responseTime).toBe(100)
    })

    it('should handle missing connection pool information', async () => {
      const dataSourceWithoutPool = {
        ...mockDataSource,
        manager: {
          connection: {},
        },
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatabaseHealthService,
          {
            provide: DataSource,
            useValue: dataSourceWithoutPool,
          },
        ],
      }).compile()

      const testService = module.get<DatabaseHealthService>(DatabaseHealthService)
      dataSourceWithoutPool.query.mockResolvedValue([{ result: 1 }])

      const result = await testService.checkHealth()

      expect(result.details.connectionCount).toBeUndefined()
    })

    it('should handle different database configurations', async () => {
      const customDataSource = {
        ...mockDataSource,
        options: {
          database: 'custom_db',
          host: 'custom.host.com',
          port: 3306,
        },
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatabaseHealthService,
          {
            provide: DataSource,
            useValue: customDataSource,
          },
        ],
      }).compile()

      const testService = module.get<DatabaseHealthService>(DatabaseHealthService)
      customDataSource.query.mockResolvedValue([{ result: 1 }])

      const result = await testService.checkHealth()

      expect(result.details).toEqual({
        database: 'custom_db',
        host: 'custom.host.com',
        port: 3306,
        connectionCount: 10,
      })
    })

    it('should handle SQL query execution', async () => {
      mockDataSource.query.mockResolvedValue([{ result: 1 }])

      await service.checkHealth()

      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1 as result')
      expect(dataSource.query).toHaveBeenCalledTimes(1)
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Query timeout')
      timeoutError.name = 'QueryTimeoutError'
      mockDataSource.query.mockRejectedValue(timeoutError)

      const result = await service.checkHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Query timeout')
    })

    it('should handle network errors', async () => {
      const networkError = new Error('ECONNREFUSED')
      networkError.name = 'NetworkError'
      mockDataSource.query.mockRejectedValue(networkError)

      const result = await service.checkHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('ECONNREFUSED')
    })

    it('should extract connection count from pool statistics', async () => {
      const poolDataSource = {
        ...mockDataSource,
        manager: {
          connection: {
            pool: {
              totalCount: 20,
              idleCount: 8,
              waitingCount: 2,
            },
          },
        },
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatabaseHealthService,
          {
            provide: DataSource,
            useValue: poolDataSource,
          },
        ],
      }).compile()

      const testService = module.get<DatabaseHealthService>(DatabaseHealthService)
      poolDataSource.query.mockResolvedValue([{ result: 1 }])

      const result = await testService.checkHealth()

      expect(result.details.connectionCount).toBe(20)
    })
  })

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should have dataSource injected', () => {
      expect(service.dataSource).toBeDefined()
      expect(service.dataSource).toBe(dataSource)
    })
  })
})
