import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { LoggingInterceptor } from '~core/interceptors/logging.interceptor';
import { CustomLoggerService } from '~core/logger/logger.service';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: jest.Mocked<CustomLoggerService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      logRequest: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    interceptor = new LoggingInterceptor(mockLogger);

    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('intercept', () => {
    it('should log incoming request', () => {
      mockCallHandler.handle.mockReturnValue(of('test response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request: GET /api/test',
        {
          method: 'GET',
          url: '/api/test',
          userAgent: 'test-agent',
          ip: '127.0.0.1',
          timestamp: expect.any(String),
        },
      );
    });

    it('should log successful response', () => {
      const responseData = { id: 1, name: 'test' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      // Mock Date.now to return different values for start and end
      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1150; // 150ms duration
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        'GET',
        '/api/test',
        200,
        150,
        'test-agent',
      );
    });

    it('should log response data in debug mode', () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      const responseData = { id: 1, name: 'test' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1100; // 100ms duration
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Response data for GET /api/test',
        'HTTP',
        {
          statusCode: 200,
          responseData,
          duration: 100,
        },
      );

      process.env.LOG_LEVEL = originalEnv;
    });

    it('should not log response data when not in debug mode', () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'info';

      const responseData = { id: 1, name: 'test' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.debug).not.toHaveBeenCalled();

      process.env.LOG_LEVEL = originalEnv;
    });

    it('should handle missing user-agent header', () => {
      mockRequest.headers = {};
      mockCallHandler.handle.mockReturnValue(of('test response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request: GET /api/test',
        {
          method: 'GET',
          url: '/api/test',
          userAgent: '',
          ip: '127.0.0.1',
          timestamp: expect.any(String),
        },
      );
    });

    it('should log error response', () => {
      const error = new Error('Test error') as Error & { status?: number };
      error.status = 400;
      error.stack = 'Error stack trace';

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1200; // 200ms duration
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          // Expected error
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed: GET /api/test',
        'Error stack trace',
        'HTTP',
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 400,
          duration: 200,
          userAgent: 'test-agent',
          error: 'Test error',
          timestamp: expect.any(String),
        },
      );
    });

    it('should handle error without status code', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      mockResponse.statusCode = 500;

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1250; // 250ms duration
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          // Expected error
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed: GET /api/test',
        'Error stack trace',
        'HTTP',
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 500,
          duration: 250,
          userAgent: 'test-agent',
          error: 'Test error',
          timestamp: expect.any(String),
        },
      );
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Test error') as Error & { status?: number };
      error.status = 404;
      error.stack = undefined;

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          // Expected error
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed: GET /api/test',
        'Error: Test error',
        'HTTP',
        expect.objectContaining({
          statusCode: 404,
          error: 'Test error',
        }),
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      // Reset response statusCode to ensure proper fallback
      mockResponse.statusCode = 200; // Default response status

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          // Expected error
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request failed: GET /api/test',
        'String error',
        'HTTP',
        expect.objectContaining({
          statusCode: 200, // Uses response.statusCode since error.status is undefined
          error: 'Unknown error',
        }),
      );
    });

    it('should handle POST request', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockResponse.statusCode = 201;

      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request: POST /api/users',
        expect.objectContaining({
          method: 'POST',
          url: '/api/users',
        }),
      );

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        'POST',
        '/api/users',
        201,
        expect.any(Number),
        'test-agent',
      );
    });
  });
});