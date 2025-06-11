import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '~modules/auth/auth.service';
import { UserService } from '~modules/user/user.service';
import { CustomLoggerService } from '~core/logger/logger.service';
import { EnvironmentService } from '~shared/services';
import { LoginDto, RegisterDto } from '~shared/dto/auth';
import { UserEntity } from '~shared/entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let mockUserService: jest.Mocked<UserService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockLogger: jest.Mocked<CustomLoggerService>;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  const mockUser: UserEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    mockJwtService = {
      sign: jest.fn(),
    } as any;

    mockLogger = {
      logBusiness: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockEnvironmentService = {
      security: {
        saltRounds: 10,
        jwtSecret: 'test-secret',
        jwtExpiresIn: '7d',
        corsOrigin: ['http://localhost:3000'],
      },
    } as any;

    service = new AuthService(mockUserService, mockJwtService, mockLogger, mockEnvironmentService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('register_attempt', 'auth', undefined, {
        email: registerDto.email,
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
      });
      expect(mockLogger.logBusiness).toHaveBeenCalledWith('registered', 'auth', mockUser.id, {
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 604800, // 7 days
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Registration failed: Email already exists - ${registerDto.email}`,
        'AuthService',
      );
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('login_attempt', 'auth', undefined, {
        email: loginDto.email,
      });
      expect(mockLogger.logBusiness).toHaveBeenCalledWith('logged_in', 'auth', mockUser.id, {
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 604800,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Login failed: Invalid credentials for ${loginDto.email}`,
        'AuthService',
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Login failed: Invalid credentials for ${loginDto.email}`,
        'AuthService',
      );
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user for valid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null for invalid password', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should handle and log errors', async () => {
      const error = new Error('Database error');
      mockUserService.findByEmail.mockRejectedValue(error);

      const result = await service.validateUser(email, password);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error validating user',
        String(error),
        'AuthService',
        { email },
      );
      expect(result).toBeNull();
    });
  });

  describe('generateAuthResponse', () => {
    it('should generate auth response with default expiration', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockEnvironmentService.security.jwtExpiresIn = '7d';

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(604800); // 7 days
    });
  });

  describe('parseExpirationTime', () => {
    it('should parse seconds correctly', async () => {
      mockEnvironmentService.security.jwtExpiresIn = '3600s';
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const result = await service.register(registerDto);
      expect(result.expiresIn).toBe(3600);
    });

    it('should parse minutes correctly', async () => {
      mockEnvironmentService.security.jwtExpiresIn = '60m';
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const result = await service.register(registerDto);
      expect(result.expiresIn).toBe(3600); // 60 minutes
    });

    it('should parse hours correctly', async () => {
      mockEnvironmentService.security.jwtExpiresIn = '24h';
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const result = await service.register(registerDto);
      expect(result.expiresIn).toBe(86400); // 24 hours
    });

    it('should parse days correctly', async () => {
      mockEnvironmentService.security.jwtExpiresIn = '7d';
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const result = await service.register(registerDto);
      expect(result.expiresIn).toBe(604800); // 7 days
    });

    it('should return default for invalid format', async () => {
      mockEnvironmentService.security.jwtExpiresIn = 'invalid';
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const result = await service.register(registerDto);
      expect(result.expiresIn).toBe(604800); // Default 7 days
    });
  });
});
