import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: CustomLoggerService;

  constructor(logger: CustomLoggerService) {
    this.logger = logger;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.info(`Incoming request: ${method} ${url}`, {
      method,
      url,
      userAgent,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response
          this.logger.logRequest(method, url, statusCode, duration, userAgent);

          // Log response data for debug level
          if (process.env.LOG_LEVEL === 'debug') {
            this.logger.debug(`Response data for ${method} ${url}`, 'HTTP', {
              statusCode,
              responseData: data,
              duration,
            });
          }
        },
        error: (error: Error & { status?: number }) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || response.statusCode || 500;
          const errorStack = error.stack || String(error);
          const errorMessage = error.message || 'Unknown error';

          // Log error response
          this.logger.error(`Request failed: ${method} ${url}`, errorStack, 'HTTP', {
            method,
            url,
            statusCode,
            duration,
            userAgent,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
