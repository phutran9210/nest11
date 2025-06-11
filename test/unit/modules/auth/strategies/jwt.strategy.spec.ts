import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from '~modules/auth/strategies/jwt.strategy';
import { UserService } from '~modules/user/user.service';
import { EnvironmentService } from '~shared/services';
import { UserEntity } from '~shared/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: UserService;
  let environmentService: EnvironmentService;

  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockEnvironmentService = {
    security: {
      jwtSecret: 'test-jwt-secret',
      jwtExpiresIn: '7d',
      saltRounds: 10,
      corsOrigin: ['http://localhost:3000'],
    },
  };

  const mockUser: UserEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockJwtPayload: JwtPayload = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'john@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 604800,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(UserService);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when valid payload is provided', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockJwtPayload);

      expect(userService.findOne).toHaveBeenCalledWith(mockJwtPayload.sub);
      expect(userService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow('User not found');
      expect(userService.findOne).toHaveBeenCalledWith(mockJwtPayload.sub);
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      mockUserService.findOne.mockResolvedValue(undefined);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException when userService throws error', async () => {
      const error = new Error('Database connection failed');
      mockUserService.findOne.mockRejectedValue(error);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow('Invalid token');
      expect(userService.findOne).toHaveBeenCalledWith(mockJwtPayload.sub);
    });

    it('should handle payload with different user ID', async () => {
      const differentPayload: JwtPayload = {
        ...mockJwtPayload,
        sub: 'different-user-id',
      };
      const differentUser = { ...mockUser, id: 'different-user-id' };
      mockUserService.findOne.mockResolvedValue(differentUser);

      const result = await strategy.validate(differentPayload);

      expect(userService.findOne).toHaveBeenCalledWith('different-user-id');
      expect(result).toEqual(differentUser);
    });

    it('should extract user ID from payload sub field', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      await strategy.validate(mockJwtPayload);

      expect(userService.findOne).toHaveBeenCalledWith(mockJwtPayload.sub);
    });

    it('should handle payload without optional fields', async () => {
      const minimalPayload: JwtPayload = {
        sub: mockJwtPayload.sub,
        email: mockJwtPayload.email,
      };
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(minimalPayload);

      expect(userService.findOne).toHaveBeenCalledWith(minimalPayload.sub);
      expect(result).toEqual(mockUser);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(strategy['userService']).toBeDefined();
      expect(strategy['userService']).toBe(userService);
    });

    it('should have environmentService injected', () => {
      expect(strategy['environmentService']).toBeDefined();
      expect(strategy['environmentService']).toBe(environmentService);
    });

    it('should configure JWT strategy with correct secret', () => {
      expect(environmentService.security.jwtSecret).toBe('test-jwt-secret');
    });
  });

  describe('error handling', () => {
    it('should throw UnauthorizedException with correct message for user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      try {
        await strategy.validate(mockJwtPayload);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('User not found');
      }
    });

    it('should throw UnauthorizedException with correct message for service errors', async () => {
      mockUserService.findOne.mockRejectedValue(new Error('Database error'));

      try {
        await strategy.validate(mockJwtPayload);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid token');
      }
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout');
      mockUserService.findOne.mockRejectedValue(timeoutError);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow('Invalid token');
    });
  });
});
