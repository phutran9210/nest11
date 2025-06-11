import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '~modules/auth/auth.controller';
import { AuthService } from '~modules/auth/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from '~shared/dto/auth';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockRegisterDto: RegisterDto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
  };

  const mockLoginDto: LoginDto = {
    email: 'john@example.com',
    password: 'Password123!',
  };

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    tokenType: 'Bearer',
    expiresIn: 604800,
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(mockRegisterDto);

      expect(service.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(service.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow('Registration failed');
      expect(service.register).toHaveBeenCalledWith(mockRegisterDto);
    });

    it('should pass correct DTO to service', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(mockRegisterDto);

      expect(service.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });
    });

    it('should return auth response with correct structure', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(mockRegisterDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('tokenType');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(mockLoginDto);

      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(mockLoginDto)).rejects.toThrow('Invalid credentials');
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
    });

    it('should pass correct DTO to service', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(mockLoginDto);

      expect(service.login).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'Password123!',
      });
    });

    it('should return auth response with correct structure', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(mockLoginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn');
      expect(result.user).toHaveProperty('email', 'john@example.com');
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(controller['authService']).toBeDefined();
      expect(controller['authService']).toBe(service);
    });
  });

  describe('HTTP status codes', () => {
    it('should return 201 for successful registration', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(mockRegisterDto);

      expect(result).toEqual(mockAuthResponse);
      // The @HttpCode(HttpStatus.CREATED) decorator ensures 201 status
    });

    it('should return 200 for successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(mockLoginDto);

      expect(result).toEqual(mockAuthResponse);
      // The @HttpCode(HttpStatus.OK) decorator ensures 200 status
    });
  });
});
