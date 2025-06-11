import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '~modules/user/user.service';
import { CustomLoggerService } from '~core/logger/logger.service';
import { EnvironmentService } from '~shared/services';
import { RateLimitService } from '~core/security';
import { LoginDto, RegisterDto, AuthResponseDto } from '~shared/dto/auth';
import { UserEntity } from '~shared/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger: CustomLoggerService;
  private readonly userService: UserService;
  private readonly jwtService: JwtService;
  private readonly environmentService: EnvironmentService;
  private readonly rateLimitService: RateLimitService;

  constructor(
    userService: UserService,
    jwtService: JwtService,
    logger: CustomLoggerService,
    environmentService: EnvironmentService,
    rateLimitService: RateLimitService,
  ) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.logger = logger;
    this.environmentService = environmentService;
    this.rateLimitService = rateLimitService;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.logBusiness('register_attempt', 'auth', undefined, { email: registerDto.email });

    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(
        `Registration failed: Email already exists - ${registerDto.email}`,
        'AuthService',
      );
      throw new ConflictException('Email already exists');
    }

    const user = await this.userService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
    });

    this.logger.logBusiness('registered', 'auth', user.id, { email: user.email });
    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    this.logger.logBusiness('login_attempt', 'auth', undefined, { email: loginDto.email });

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed: Invalid credentials for ${loginDto.email}`, 'AuthService');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset rate limits on successful login
    if (ipAddress) {
      await this.rateLimitService.resetLoginRateLimit(ipAddress, loginDto.email);
    }

    this.logger.logBusiness('logged_in', 'auth', user.id, { email: user.email });
    return this.generateAuthResponse(user);
  }

  /**
   * Check rate limits before attempting login
   */
  async checkLoginRateLimit(ipAddress: string, email: string): Promise<void> {
    // Check IP-based rate limit
    const ipResult = await this.rateLimitService.checkLoginAttempts(ipAddress);
    if (!ipResult.allowed) {
      const message = ipResult.blocked
        ? `Too many login attempts from this IP. Try again after ${new Date(ipResult.resetTime).toLocaleTimeString()}`
        : 'Too many login attempts from this IP. Please try again later.';

      this.logger.warn(`IP rate limit exceeded: ${ipAddress}`, 'AuthService');
      throw new UnauthorizedException(message);
    }

    // Check username-based rate limit
    const userResult = await this.rateLimitService.checkUsernameAttempts(email);
    if (!userResult.allowed) {
      const message = userResult.blocked
        ? `Too many login attempts for this account. Try again after ${new Date(userResult.resetTime).toLocaleTimeString()}`
        : 'Too many login attempts for this account. Please try again later.';

      this.logger.warn(`Username rate limit exceeded: ${email}`, 'AuthService');
      throw new UnauthorizedException(message);
    }
  }

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Error validating user', String(error), 'AuthService', { email });
      return null;
    }
  }

  private generateAuthResponse(user: UserEntity): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.parseExpirationTime(this.environmentService.security.jwtExpiresIn);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 604800; // Default 7 days in seconds
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's':
        return numValue;
      case 'm':
        return numValue * 60;
      case 'h':
        return numValue * 3600;
      case 'd':
        return numValue * 86400;
      default:
        return 604800;
    }
  }
}
