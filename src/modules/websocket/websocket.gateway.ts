import { Logger, UseGuards } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { UserEntity } from '~/shared/entities/user.entity'
import { WsAuthGuard } from './ws-auth.guard'

interface AuthenticatedSocket extends Socket {
  user?: UserEntity
  lastPing?: Date
  reconnectAttempts?: number
  isHealthy?: boolean
}

export interface ConnectionStats {
  clientId: string
  connectedAt: Date
  lastActivity: Date
  reconnectCount: number
  disconnectReason?: string
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/ws',
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class AppWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(AppWebSocketGateway.name)
  private connectedClients = new Map<string, AuthenticatedSocket>()
  private connectionStats = new Map<string, ConnectionStats>()
  private reconnectAttempts = new Map<string, number>()
  private readonly maxReconnectAttempts = 5
  private readonly healthCheckInterval = 30000 // 30 seconds

  afterInit() {
    this.logger.log('WebSocket Gateway initialized')
    this.setupServerErrorHandling()
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`)

    // Initialize client properties
    client.lastPing = new Date()
    client.reconnectAttempts = this.reconnectAttempts.get(client.id) || 0
    client.isHealthy = true

    this.connectedClients.set(client.id, client)

    // Track connection stats
    this.connectionStats.set(client.id, {
      clientId: client.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      reconnectCount: client.reconnectAttempts,
    })

    // Setup client-specific error handling
    this.setupClientErrorHandling(client)

    // Send connection success message
    client.emit('connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
      message: 'Connected successfully',
    })

    // Check for excessive reconnect attempts
    if (client.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.warn(
        `Client ${client.id} has exceeded max reconnect attempts (${this.maxReconnectAttempts})`,
      )
      client.emit('reconnect_limit_exceeded', {
        attempts: client.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      })
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const reason = client.disconnected ? 'client_disconnect' : 'server_disconnect'
    this.logger.log(`Client disconnected: ${client.id}, reason: ${reason}`)

    // Update connection stats
    const stats = this.connectionStats.get(client.id)
    if (stats) {
      stats.disconnectReason = reason
      this.connectionStats.set(client.id, stats)
    }

    // Increment reconnect attempts for this client
    const attempts = this.reconnectAttempts.get(client.id) || 0
    this.reconnectAttempts.set(client.id, attempts + 1)

    // Clean up
    this.connectedClients.delete(client.id)

    // Log reconnect attempts
    if (attempts > 0) {
      this.logger.warn(`Client ${client.id} disconnected after ${attempts} reconnect attempts`)
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
    client.lastPing = new Date()
    client.isHealthy = true

    // Update activity timestamp
    const stats = this.connectionStats.get(client.id)
    if (stats) {
      stats.lastActivity = new Date()
      this.connectionStats.set(client.id, stats)
    }

    client.emit('pong', {
      timestamp: new Date().toISOString(),
      clientId: client.id,
      healthy: client.isHealthy,
    })
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket): void {
    client.lastPing = new Date()
    client.isHealthy = true

    const stats = this.connectionStats.get(client.id)
    if (stats) {
      stats.lastActivity = new Date()
      this.connectionStats.set(client.id, stats)
    }

    client.emit('heartbeat_ack', {
      timestamp: new Date().toISOString(),
      status: 'healthy',
    })
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const user = client.user
    if (!user) return
    await client.join(data.room)
    this.logger.log(`User ${user.email} joined room: ${data.room}`)
    client.emit('joined-room', { room: data.room, user: user.email })
    this.server.to(data.room).emit('user-joined', { user: user.email })
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const user = client.user
    if (!user) return
    await client.leave(data.room)
    this.logger.log(`User ${user.email} left room: ${data.room}`)
    this.server.to(data.room).emit('user-left', { user: user.email })
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('send-message')
  handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    const user = client.user
    if (!user) return
    const messageData = {
      user: user.email,
      message: data.message,
      timestamp: new Date().toISOString(),
    }

    if (data.room) {
      this.server.to(data.room).emit('message', messageData)
    } else {
      this.server.emit('message', messageData)
    }
  }

  // Utility methods for broadcasting messages
  broadcastToAll(event: string, data: unknown): void {
    this.server.emit(event, data)
  }

  broadcastToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data)
  }

  sendToClient(clientId: string, event: string, data: unknown): void {
    const client = this.connectedClients.get(clientId)
    if (client) {
      client.emit(event, data)
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  // Connection error handling and monitoring methods
  private setupServerErrorHandling(): void {
    this.server.on('error', (error) => {
      this.logger.error('WebSocket server error:', error)
    })

    this.server.on('connection_error', (error) => {
      this.logger.error('WebSocket connection error:', error)
    })
  }

  private setupClientErrorHandling(client: AuthenticatedSocket): void {
    client.on('error', (error) => {
      this.logger.error(`Client ${client.id} error:`, error)
      client.isHealthy = false

      // Emit error details to client
      client.emit('connection_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
        clientId: client.id,
      })
    })

    client.on('disconnect', (reason) => {
      this.logger.log(`Client ${client.id} disconnected with reason: ${reason}`)

      // Update stats with disconnect reason
      const stats = this.connectionStats.get(client.id)
      if (stats) {
        stats.disconnectReason = reason
        this.connectionStats.set(client.id, stats)
      }
    })

    client.on('reconnect', (attemptNumber: number) => {
      this.logger.log(`Client ${client.id} reconnecting, attempt: ${attemptNumber}`)
      this.reconnectAttempts.set(client.id, attemptNumber)
    })

    client.on('reconnect_failed', () => {
      this.logger.error(`Client ${client.id} failed to reconnect after maximum attempts`)
      client.emit('reconnect_failed', {
        message: 'Maximum reconnection attempts exceeded',
        maxAttempts: this.maxReconnectAttempts,
        timestamp: new Date().toISOString(),
      })
    })
  }

  // Health check - runs every 30 seconds
  @Cron(CronExpression.EVERY_30_SECONDS)
  private performHealthCheck(): void {
    const now = new Date()
    const unhealthyClients: string[] = []

    this.connectedClients.forEach((client, clientId) => {
      const lastPing = client.lastPing || new Date(0)
      const timeSinceLastPing = now.getTime() - lastPing.getTime()

      if (timeSinceLastPing > this.healthCheckInterval) {
        client.isHealthy = false
        unhealthyClients.push(clientId)

        // Send health check ping
        client.emit('health_check', {
          timestamp: now.toISOString(),
          timeSinceLastPing,
          status: 'unhealthy',
        })

        // Disconnect if no response for too long (2 minutes)
        if (timeSinceLastPing > 120000) {
          this.logger.warn(
            `Disconnecting unhealthy client ${clientId} after 2 minutes of inactivity`,
          )
          client.disconnect()
        }
      }
    })

    if (unhealthyClients.length > 0) {
      this.logger.warn(
        `Found ${unhealthyClients.length} unhealthy clients: ${unhealthyClients.join(', ')}`,
      )
    }
  }

  // Get connection statistics
  getConnectionStats(): ConnectionStats[] {
    return Array.from(this.connectionStats.values())
  }

  // Get client health status
  getClientHealth(clientId: string): { healthy: boolean; lastPing?: Date } | null {
    const client = this.connectedClients.get(clientId)
    if (!client) return null

    return {
      healthy: client.isHealthy || false,
      lastPing: client.lastPing,
    }
  }

  // Force disconnect problematic clients
  forceDisconnectClient(clientId: string, reason: string): boolean {
    const client = this.connectedClients.get(clientId)
    if (!client) return false

    this.logger.log(`Force disconnecting client ${clientId}, reason: ${reason}`)
    client.emit('force_disconnect', {
      reason,
      timestamp: new Date().toISOString(),
    })

    client.disconnect()
    return true
  }

  // Clear reconnect attempts for a client (useful for admin actions)
  clearReconnectAttempts(clientId: string): void {
    this.reconnectAttempts.delete(clientId)
    this.logger.log(`Cleared reconnect attempts for client ${clientId}`)
  }

  // Get server health status
  getServerHealth(): {
    connectedClients: number
    totalReconnectAttempts: number
    unhealthyClients: number
  } {
    let unhealthyCount = 0
    this.connectedClients.forEach((client) => {
      if (!client.isHealthy) unhealthyCount++
    })

    return {
      connectedClients: this.connectedClients.size,
      totalReconnectAttempts: Array.from(this.reconnectAttempts.values()).reduce(
        (a, b) => a + b,
        0,
      ),
      unhealthyClients: unhealthyCount,
    }
  }
}
