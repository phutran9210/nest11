import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppWebSocketGateway } from './websocket.gateway';
import { WsAuthGuard } from './ws-auth.guard';
import { UserModule } from '~/modules/user/user.module';

@Module({
  imports: [JwtModule, UserModule],
  providers: [AppWebSocketGateway, WsAuthGuard],
  exports: [AppWebSocketGateway],
})
export class WebSocketModule {}
