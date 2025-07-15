import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './ws-auth.guard';
import { UserEntity } from '~/shared/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  user?: UserEntity;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class AppWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const user = client.user;
    if (!user) return;
    await client.join(data.room);
    this.logger.log(`User ${user.email} joined room: ${data.room}`);
    client.emit('joined-room', { room: data.room, user: user.email });
    this.server.to(data.room).emit('user-joined', { user: user.email });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const user = client.user;
    if (!user) return;
    await client.leave(data.room);
    this.logger.log(`User ${user.email} left room: ${data.room}`);
    this.server.to(data.room).emit('user-left', { user: user.email });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('send-message')
  handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    const user = client.user;
    if (!user) return;
    const messageData = {
      user: user.email,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    if (data.room) {
      this.server.to(data.room).emit('message', messageData);
    } else {
      this.server.emit('message', messageData);
    }
  }

  // Utility methods for broadcasting messages
  broadcastToAll(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  broadcastToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }

  sendToClient(clientId: string, event: string, data: unknown): void {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
