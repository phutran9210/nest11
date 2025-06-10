import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService, IHealthCheckResponse } from '~/app.service';
import { Public } from '~core/decorators';

@Controller('status')
@ApiTags('health')
export class AppController {
  private readonly appService: AppService;

  constructor(appService: AppService) {
    this.appService = appService;
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check server health',
    description: 'Returns server status and basic information',
  })
  @ApiOkResponse({
    description: 'Server is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Server is running' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        uptime: { type: 'number', example: 123.45 },
      },
    },
  })
  checkHealth(): IHealthCheckResponse {
    return this.appService.checkHealth();
  }
}
