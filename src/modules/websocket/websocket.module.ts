import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { UserModule } from '~/modules/user/user.module'
import { WebSocketController } from './websocket.controller'
import { AppWebSocketGateway } from './websocket.gateway'
import { WsAuthGuard } from './ws-auth.guard'

@Module({
  imports: [JwtModule, UserModule, ScheduleModule.forRoot()],
  controllers: [WebSocketController],
  providers: [AppWebSocketGateway, WsAuthGuard],
  exports: [AppWebSocketGateway],
})
export class WebSocketModule {}
