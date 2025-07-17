import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JwtBlacklistService } from '~core/security'
import { UserService } from '~modules/user/user.service'
import { UserEntity } from '~shared/entities/user.entity'
import { EnvironmentService } from '~shared/services'

export interface JwtPayload {
  sub: string
  email: string
  jti: string
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly environmentService: EnvironmentService,
    private readonly jwtBlacklistService: JwtBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: environmentService.security.jwtSecret,
    })
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const { sub: userId, jti, iat, type } = payload

    try {
      if (type !== 'access') {
        throw new UnauthorizedException('Invalid token type')
      }

      const isBlacklisted = await this.jwtBlacklistService.isTokenBlacklisted(jti)
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked')
      }

      if (iat) {
        const isUserTokenValid = await this.jwtBlacklistService.isUserTokenValid(userId, iat)
        if (!isUserTokenValid) {
          throw new UnauthorizedException('Token has been invalidated')
        }
      }

      const user = await this.userService.findOne(userId)
      if (!user) {
        throw new UnauthorizedException('User not found')
      }
      return user
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Invalid token')
    }
  }
}
