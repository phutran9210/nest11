import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RequirePermission } from '~/core/decorators'
import { JwtAuthGuard } from '~/core/guards'
import { PermissionAction, PermissionResource } from '~/shared/entities/permission.entity'
import { AppWebSocketGateway, ConnectionStats } from './websocket.gateway'

@ApiTags('WebSocket Management')
@Controller('websocket')
@UseGuards(JwtAuthGuard)
export class WebSocketController {
  constructor(private readonly wsGateway: AppWebSocketGateway) {}

  @Get('health')
  @ApiOperation({ summary: 'Get WebSocket server health status' })
  @ApiResponse({ status: 200, description: 'Returns server health metrics' })
  getServerHealth() {
    return this.wsGateway.getServerHealth()
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get connection statistics' })
  @ApiResponse({ status: 200, description: 'Returns connection statistics' })
  @RequirePermission(PermissionAction.READ, PermissionResource.WEBSOCKET)
  getConnectionStats(): {
    stats: ConnectionStats[]
    connectedClients: number
    serverHealth: {
      connectedClients: number
      totalReconnectAttempts: number
      unhealthyClients: number
    }
  } {
    return {
      stats: this.wsGateway.getConnectionStats(),
      connectedClients: this.wsGateway.getConnectedClientsCount(),
      serverHealth: this.wsGateway.getServerHealth(),
    }
  }

  @Get('client/:clientId/health')
  @ApiOperation({ summary: 'Get specific client health status' })
  @ApiResponse({ status: 200, description: 'Returns client health status' })
  @RequirePermission(PermissionAction.READ, PermissionResource.WEBSOCKET)
  getClientHealth(@Param('clientId') clientId: string) {
    const health = this.wsGateway.getClientHealth(clientId)
    if (!health) {
      return { error: 'Client not found' }
    }
    return health
  }

  @Delete('client/:clientId')
  @ApiOperation({ summary: 'Force disconnect a client' })
  @ApiResponse({ status: 200, description: 'Client disconnected successfully' })
  @RequirePermission(PermissionAction.MANAGE, PermissionResource.WEBSOCKET)
  forceDisconnectClient(@Param('clientId') clientId: string, @Body() body: { reason?: string }) {
    const reason = body.reason || 'Admin forced disconnect'
    const result = this.wsGateway.forceDisconnectClient(clientId, reason)

    return {
      success: result,
      message: result ? 'Client disconnected successfully' : 'Client not found',
    }
  }

  @Post('client/:clientId/clear-reconnect-attempts')
  @ApiOperation({ summary: 'Clear reconnect attempts for a client' })
  @ApiResponse({ status: 200, description: 'Reconnect attempts cleared' })
  @RequirePermission(PermissionAction.MANAGE, PermissionResource.WEBSOCKET)
  clearReconnectAttempts(@Param('clientId') clientId: string) {
    this.wsGateway.clearReconnectAttempts(clientId)
    return { message: 'Reconnect attempts cleared successfully' }
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast message to all connected clients' })
  @ApiResponse({ status: 200, description: 'Message broadcasted successfully' })
  @RequirePermission(PermissionAction.MANAGE, PermissionResource.WEBSOCKET)
  broadcastMessage(@Body() body: { event: string; data: unknown }) {
    this.wsGateway.broadcastToAll(body.event, body.data)
    return { message: 'Message broadcasted successfully' }
  }

  @Post('room/:room/broadcast')
  @ApiOperation({ summary: 'Broadcast message to specific room' })
  @ApiResponse({ status: 200, description: 'Message broadcasted to room successfully' })
  @RequirePermission(PermissionAction.MANAGE, PermissionResource.WEBSOCKET)
  broadcastToRoom(@Param('room') room: string, @Body() body: { event: string; data: unknown }) {
    this.wsGateway.broadcastToRoom(room, body.event, body.data)
    return { message: `Message broadcasted to room ${room} successfully` }
  }
}
