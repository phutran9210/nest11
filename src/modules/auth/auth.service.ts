import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserService } from '~modules/user/user.service';
import { CustomLoggerService } from '~core/logger/logger.service';
import { EnvironmentService, IdempotencyService } from '~shared/services';
import { RateLimitService } from '~core/security';
// import { RedisLockService } from '~core/redis/services';
import { LoginDto, RegisterDto, AuthResponseDto } from '~shared/dto/auth';
import { UserEntity } from '~shared/entities/user.entity';
import { IdempotencyStatus } from '~shared/entities/idempotency-key.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger: CustomLoggerService;
  private readonly userService: UserService;
  private readonly jwtService: JwtService;
  private readonly environmentService: EnvironmentService;
  private readonly rateLimitService: RateLimitService;
  private readonly idempotencyService: IdempotencyService;
  // private readonly redisLockService: RedisLockService;

  constructor(
    userService: UserService,
    jwtService: JwtService,
    logger: CustomLoggerService,
    environmentService: EnvironmentService,
    rateLimitService: RateLimitService,
    idempotencyService: IdempotencyService,
    // redisLockService: RedisLockService,
  ) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.logger = logger;
    this.environmentService = environmentService;
    this.rateLimitService = rateLimitService;
    this.idempotencyService = idempotencyService;
    // this.redisLockService = redisLockService;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.logBusiness('register_attempt', 'auth', undefined, { email: registerDto.email });

    const idempotencyKey = registerDto.idempotencyKey ?? randomUUID();
    // const lockKey = `user_registration:${registerDto.email}`;

    const idempotencyResult = await this.checkIdempotency(idempotencyKey, registerDto);
    if (idempotencyResult) {
      return idempotencyResult;
    }

    // Temporarily bypass Redis lock
    return this.performRegistration(registerDto, idempotencyKey);
  }

  private async checkIdempotency(
    idempotencyKey: string,
    registerDto: RegisterDto,
  ): Promise<AuthResponseDto | null> {
    const idempotencyResult =
      await this.idempotencyService.checkOrCreateIdempotencyKey<AuthResponseDto>(
        idempotencyKey,
        'user_registration',
        { email: registerDto.email, name: registerDto.name } as Record<string, unknown>,
      );

    if (!idempotencyResult.isExisting) {
      return null;
    }

    if (idempotencyResult.status === IdempotencyStatus.COMPLETED) {
      this.logger.logBusiness('register_idempotent_return', 'auth', undefined, {
        email: registerDto.email,
        idempotencyKey,
      });
      return idempotencyResult.data!;
    }

    if (idempotencyResult.status === IdempotencyStatus.FAILED) {
      throw new ConflictException('Previous registration attempt failed');
    }

    return null;
  }

  private async performRegistration(
    registerDto: RegisterDto,
    idempotencyKey: string,
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.userService.create({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
      });

      const authResponse = this.generateAuthResponse(user);
      await this.updateIdempotencySuccess(idempotencyKey, authResponse, user.id);

      this.logger.logBusiness('registered', 'auth', user.id, {
        email: user.email,
        idempotencyKey,
      });

      return authResponse;
    } catch (error: unknown) {
      await this.handleRegistrationError(error, registerDto, idempotencyKey);
      throw error;
    }
  }

  private async updateIdempotencySuccess(
    idempotencyKey: string,
    authResponse: AuthResponseDto,
    userId: string,
  ): Promise<void> {
    await this.idempotencyService.updateIdempotencyKey(
      idempotencyKey,
      'user_registration',
      IdempotencyStatus.COMPLETED,
      authResponse as unknown as Record<string, unknown>,
      undefined,
      userId,
    );
  }

  private async handleRegistrationError(
    error: unknown,
    registerDto: RegisterDto,
    idempotencyKey: string,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await this.idempotencyService.updateIdempotencyKey(
      idempotencyKey,
      'user_registration',
      IdempotencyStatus.FAILED,
      undefined,
      errorMessage,
    );

    if (this.isEmailExistsError(error)) {
      this.logger.warn(
        `Registration failed: Email already exists - ${registerDto.email}`,
        'AuthService',
      );
      throw new ConflictException('Email already exists');
    }

    this.logger.error('Registration failed', errorMessage, 'AuthService', {
      email: registerDto.email,
      idempotencyKey,
    });
  }

  private isEmailExistsError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === '23505' ||
        ('constraint' in error &&
          typeof error.constraint === 'string' &&
          error.constraint.includes('email')))
    );
  }

  async login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    this.logger.logBusiness('login_attempt', 'auth', undefined, { email: loginDto.email });

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.handleLoginFailure(loginDto.email);
    }

    await this.handleSuccessfulLogin(user, loginDto.email, ipAddress);
    return this.generateAuthResponse(user);
  }

  private handleLoginFailure(email: string): never {
    this.logger.warn(`Login failed: Invalid credentials for ${email}`, 'AuthService');
    throw new UnauthorizedException('Invalid credentials');
  }

  private async handleSuccessfulLogin(
    user: UserEntity,
    email: string,
    ipAddress?: string,
  ): Promise<void> {
    if (ipAddress) {
      await this.rateLimitService.resetLoginRateLimit(ipAddress, email);
    }
    this.logger.logBusiness('logged_in', 'auth', user.id, { email: user.email });
  }

  /**
   * Check rate limits before attempting login
   */
  async checkLoginRateLimit(ipAddress: string, email: string): Promise<void> {
    await this.checkIpRateLimit(ipAddress);
    await this.checkUsernameRateLimit(email);
  }

  private async checkIpRateLimit(ipAddress: string): Promise<void> {
    const ipResult = await this.rateLimitService.checkLoginAttempts(ipAddress);
    if (!ipResult.allowed) {
      const message = this.formatRateLimitMessage(ipResult.blocked, ipResult.resetTime, 'this IP');
      this.logger.warn(`IP rate limit exceeded: ${ipAddress}`, 'AuthService');
      throw new UnauthorizedException(message);
    }
  }

  private async checkUsernameRateLimit(email: string): Promise<void> {
    const userResult = await this.rateLimitService.checkUsernameAttempts(email);
    if (!userResult.allowed) {
      const message = this.formatRateLimitMessage(
        userResult.blocked,
        userResult.resetTime,
        'this account',
      );
      this.logger.warn(`Username rate limit exceeded: ${email}`, 'AuthService');
      throw new UnauthorizedException(message);
    }
  }

  private formatRateLimitMessage(blocked: boolean, resetTime: number, target: string): string {
    return blocked
      ? `Too many login attempts from ${target}. Try again after ${new Date(resetTime).toLocaleTimeString()}`
      : `Too many login attempts from ${target}. Please try again later.`;
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
