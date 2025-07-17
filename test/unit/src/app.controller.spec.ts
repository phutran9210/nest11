import { Test, type TestingModule } from '@nestjs/testing'
import { AppController } from '~/app.controller'
import { AppService, type IHealthCheckResponse } from '~/app.service'

describe('AppController', () => {
  let controller: AppController
  let service: AppService

  const mockAppService = {
    checkHealth: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile()

    controller = module.get<AppController>(AppController)
    service = module.get<AppService>(AppService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('checkHealth', () => {
    it('should return health check response', () => {
      const mockHealthResponse: IHealthCheckResponse = {
        status: 'ok',
        message: 'Server is running',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        uptime: 123.45,
      }

      mockAppService.checkHealth.mockReturnValue(mockHealthResponse)

      const result = controller.checkHealth()

      expect(service.checkHealth).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockHealthResponse)
    })

    it('should call service checkHealth method', () => {
      const mockHealthResponse: IHealthCheckResponse = {
        status: 'ok',
        message: 'Server is running',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        uptime: 456.78,
      }

      mockAppService.checkHealth.mockReturnValue(mockHealthResponse)

      controller.checkHealth()

      expect(service.checkHealth).toHaveBeenCalledWith()
    })

    it('should handle service errors gracefully', () => {
      const error = new Error('Service error')
      mockAppService.checkHealth.mockImplementation(() => {
        throw error
      })

      expect(() => controller.checkHealth()).toThrow('Service error')
      expect(service.checkHealth).toHaveBeenCalledTimes(1)
    })
  })

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined()
    })

    it('should have appService injected', () => {
      expect(controller.appService).toBeDefined()
      expect(controller.appService).toBe(service)
    })
  })
})
