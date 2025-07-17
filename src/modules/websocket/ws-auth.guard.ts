import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { JwtBlacklistService } from '~/core/security'
import { JwtPayload } from '~/modules/auth/strategies/jwt.strategy'
import { UserService } from '~/modules/user/user.service'
import { UserEntity } from '~/shared/entities/user.entity'
import { EnvironmentService } from '~/shared/services'

interface AuthenticatedSocket extends Socket {
  user?: UserEntity
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly environmentService: EnvironmentService,
    private readonly jwtBlacklistService: JwtBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient()
    const token = this.extractTokenFromHandshake(client)

    if (!token) {
      this.disconnect(client, 'No token provided')
      return false
    }

    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: this.environmentService.security.jwtSecret,
      })

      if (payload.type !== 'access') {
        this.disconnect(client, 'Invalid token type')
        return false
      }

      const isBlacklisted = await this.jwtBlacklistService.isTokenBlacklisted(payload.jti)
      if (isBlacklisted) {
        this.disconnect(client, 'Token has been revoked')
        return false
      }

      if (payload.iat) {
        const isUserTokenValid = await this.jwtBlacklistService.isUserTokenValid(
          payload.sub,
          payload.iat,
        )
        if (!isUserTokenValid) {
          this.disconnect(client, 'Token has been invalidated')
          return false
        }
      }

      const user = await this.userService.findOne(payload.sub)
      if (!user) {
        this.disconnect(client, 'User not found')
        return false
      }

      client.user = user
      return true
    } catch {
      this.disconnect(client, 'Invalid token')
      return false
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    const token = client.handshake.query.token
    if (token && typeof token === 'string') {
      return token
    }

    const auth = client.handshake.auth as { token: string } | undefined
    if (auth?.token) {
      return auth.token
    }

    return null
  }

  private disconnect(client: Socket, message: string): void {
    client.emit('error', new UnauthorizedException(message))
    client.disconnect()
  }
}
