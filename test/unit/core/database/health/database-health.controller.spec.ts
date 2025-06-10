import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthController } from '../../../../../src/core/database/health/database-health.controller';
import { DatabaseHealthService, IDatabaseHealthStatus } from '../../../../../src/core/database/health/database-health.service';

describe('DatabaseHealthController', () => {
  let controller: DatabaseHealthController;
  let service: DatabaseHealthService;

  const mockDatabaseHealthService = {
    checkHealth: jest.fn(),
  };

  const mockHealthyStatus: IDatabaseHealthStatus = {
    status: 'healthy',
    isConnected: true,
    responseTime: 25,
    details: {
      database: 'test_db',
      host: 'localhost',
      port: 5432,
      connectionCount: 10,
    },
  };

  const mockUnhealthyStatus: IDatabaseHealthStatus = {
    status: 'unhealthy',
    isConnected: false,
    responseTime: 150,
    error: 'Connection timeout',
    details: {
      database: 'test_db',
      host: 'localhost',
      port: 5432,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseHealthController],
      providers: [
        {
          provide: DatabaseHealthService,
          useValue: mockDatabaseHealthService,
        },
      ],
    }).compile();

    controller = module.get<DatabaseHealthController>(DatabaseHealthController);
    service = module.get<DatabaseHealthService>(DatabaseHealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy database status', async () => {
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockHealthyStatus);

      const result = await controller.checkDatabaseHealth();

      expect(service.checkHealth).toHaveBeenCalledTimes(1);
      expect(service.checkHealth).toHaveBeenCalledWith();
      expect(result).toEqual(mockHealthyStatus);
    });

    it('should return unhealthy database status', async () => {
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockUnhealthyStatus);

      const result = await controller.checkDatabaseHealth();

      expect(service.checkHealth).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUnhealthyStatus);
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection timeout');
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Internal service error');
      mockDatabaseHealthService.checkHealth.mockRejectedValue(error);

      await expect(controller.checkDatabaseHealth()).rejects.toThrow('Internal service error');
      expect(service.checkHealth).toHaveBeenCalledTimes(1);
    });

    it('should return response with correct structure for healthy status', async () => {
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockHealthyStatus);

      const result = await controller.checkDatabaseHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('isConnected');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('database');
      expect(result.details).toHaveProperty('host');
      expect(result.details).toHaveProperty('port');
      expect(result.details).toHaveProperty('connectionCount');
    });

    it('should return response with correct structure for unhealthy status', async () => {
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockUnhealthyStatus);

      const result = await controller.checkDatabaseHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('isConnected');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('details');
    });

    it('should handle different response times', async () => {
      const fastResponse = { ...mockHealthyStatus, responseTime: 5 };
      const slowResponse = { ...mockHealthyStatus, responseTime: 2000 };

      mockDatabaseHealthService.checkHealth.mockResolvedValueOnce(fastResponse);
      let result = await controller.checkDatabaseHealth();
      expect(result.responseTime).toBe(5);

      mockDatabaseHealthService.checkHealth.mockResolvedValueOnce(slowResponse);
      result = await controller.checkDatabaseHealth();
      expect(result.responseTime).toBe(2000);
    });

    it('should handle different database configurations', async () => {
      const customDbStatus = {
        ...mockHealthyStatus,
        details: {
          database: 'production_db',
          host: 'prod.example.com',
          port: 3306,
          connectionCount: 50,
        },
      };

      mockDatabaseHealthService.checkHealth.mockResolvedValue(customDbStatus);

      const result = await controller.checkDatabaseHealth();

      expect(result.details.database).toBe('production_db');
      expect(result.details.host).toBe('prod.example.com');
      expect(result.details.port).toBe(3306);
      expect(result.details.connectionCount).toBe(50);
    });

    it('should handle concurrent requests', async () => {
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockHealthyStatus);

      const promises = [
        controller.checkDatabaseHealth(),
        controller.checkDatabaseHealth(),
        controller.checkDatabaseHealth(),
      ];

      const results = await Promise.all(promises);

      expect(service.checkHealth).toHaveBeenCalledTimes(3);
      results.forEach(result => {
        expect(result).toEqual(mockHealthyStatus);
      });
    });

    it('should not modify service response', async () => {
      const originalStatus = { ...mockHealthyStatus };
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockHealthyStatus);

      const result = await controller.checkDatabaseHealth();

      expect(result).toEqual(originalStatus);
      expect(mockHealthyStatus).toEqual(originalStatus);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have databaseHealthService injected', () => {
      expect(controller['databaseHealthService']).toBeDefined();
      expect(controller['databaseHealthService']).toBe(service);
    });
  });

  describe('error scenarios', () => {
    it('should handle database connection errors', async () => {
      const connectionError = new Error('ECONNREFUSED');
      mockDatabaseHealthService.checkHealth.mockRejectedValue(connectionError);

      await expect(controller.checkDatabaseHealth()).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      mockDatabaseHealthService.checkHealth.mockRejectedValue(timeoutError);

      await expect(controller.checkDatabaseHealth()).rejects.toThrow('Connection timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockDatabaseHealthService.checkHealth.mockRejectedValue(authError);

      await expect(controller.checkDatabaseHealth()).rejects.toThrow('Authentication failed');
    });
  });

  describe('performance', () => {
    it('should complete health check within reasonable time', async () => {
      mockDatabaseHealthService.checkHealth.mockResolvedValue(mockHealthyStatus);

      const startTime = Date.now();
      await controller.checkDatabaseHealth();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});