import { Injectable } from '@nestjs/common'
import { CustomLoggerService } from '~core/logger/logger.service'

export interface IHealthCheckResponse {
  status: string
  message: string
  timestamp: string
  version: string
  uptime: number
}

@Injectable()
export class AppService {
  constructor(private readonly logger: CustomLoggerService) {}

  checkHealth(): IHealthCheckResponse {
    this.logger.info('Health check requested')

    const healthResponse = {
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
    }

    this.logger.logStartup('Health check completed', healthResponse)
    return healthResponse
  }
}
