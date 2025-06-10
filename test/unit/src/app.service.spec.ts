import { Test, TestingModule } from '@nestjs/testing';
import { AppService, IHealthCheckResponse } from '../../../src/app.service';
import { CustomLoggerService } from '../../../src/core/logger/logger.service';

describe('AppService', () => {
  let service: AppService;
  let logger: CustomLoggerService;

  const mockLogger = {
    info: jest.fn(),
    logStartup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');
      jest.spyOn(process, 'uptime').mockReturnValue(123.456);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return health check response with correct structure', () => {
      const result: IHealthCheckResponse = service.checkHealth();

      expect(result).toEqual({
        status: 'ok',
        message: 'Server is running',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        uptime: 123.456,
      });
    });

    it('should log health check request', () => {
      service.checkHealth();

      expect(logger.info).toHaveBeenCalledWith('Health check requested');
    });

    it('should log health check completion with response data', () => {
      const result = service.checkHealth();

      expect(logger.logStartup).toHaveBeenCalledWith('Health check completed', result);
    });

    it('should call both logger methods in correct order', () => {
      service.checkHealth();

      expect(logger.info).toHaveBeenCalledBefore(logger.logStartup as jest.Mock);
    });

    it('should return current timestamp', () => {
      const mockDate = '2024-12-01T12:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      const result = service.checkHealth();

      expect(result.timestamp).toBe(mockDate);
    });

    it('should return current process uptime', () => {
      const mockUptime = 999.123;
      jest.spyOn(process, 'uptime').mockReturnValue(mockUptime);

      const result = service.checkHealth();

      expect(result.uptime).toBe(mockUptime);
    });

    it('should always return status ok', () => {
      const result = service.checkHealth();

      expect(result.status).toBe('ok');
    });

    it('should always return correct message', () => {
      const result = service.checkHealth();

      expect(result.message).toBe('Server is running');
    });

    it('should always return version 1.0.0', () => {
      const result = service.checkHealth();

      expect(result.version).toBe('1.0.0');
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have logger injected', () => {
      expect(service['logger']).toBeDefined();
      expect(service['logger']).toBe(logger);
    });
  });
});