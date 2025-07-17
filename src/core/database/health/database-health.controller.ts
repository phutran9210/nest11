import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiSuccessResponse } from '~/core/decorators'
import { DatabaseHealthService, IDatabaseHealthStatus } from './database-health.service'

@ApiTags('health')
@Controller('health')
export class DatabaseHealthController {
  private readonly databaseHealthService: DatabaseHealthService

  constructor(databaseHealthService: DatabaseHealthService) {
    this.databaseHealthService = databaseHealthService
  }

  @Get('database')
  @ApiSuccessResponse({
    description: 'Database health status',
    type: Object, // Could create a proper DTO here
  })
  async checkDatabaseHealth(): Promise<IDatabaseHealthStatus> {
    return this.databaseHealthService.checkHealth()
  }

  @Get('database/status')
  @ApiSuccessResponse({
    description: 'Simple database health check',
    type: Boolean,
  })
  async isDatabaseHealthy(): Promise<{ healthy: boolean }> {
    const isHealthy = await this.databaseHealthService.isHealthy()
    return { healthy: isHealthy }
  }
}
