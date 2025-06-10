import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '~modules/user/user.service';
import { EnvironmentService } from '~shared/services';
import { UserEntity } from '~shared/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly userService: UserService;
  private readonly environmentService: EnvironmentService;

  constructor(userService: UserService, environmentService: EnvironmentService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: environmentService.security.jwtSecret,
    });
    this.userService = userService;
    this.environmentService = environmentService;
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const { sub: userId } = payload;

    try {
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
