import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from '~modules/user/user.service';
import { UserEntity } from '~shared/entities/user.entity';
import { CreateUserDto } from '~shared/dto/create-user.dto';
import { UpdateUserDto } from '~shared/dto/update-user.dto';
import { CustomLoggerService } from '~core/logger/logger.service';
import { EnvironmentService } from '~shared/services';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: jest.Mocked<Repository<UserEntity>>;
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
    mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockLogger = {
      logBusiness: jest.fn(),
      info: jest.fn(),
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

    service = new UserService(mockUserRepository, mockLogger, mockEnvironmentService);

    // Reset mocks
    jest.clearAllMocks();
    (mockedBcrypt.hash as jest.MockedFunction<any>).mockResolvedValue('hashedPassword');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'plainPassword',
    };

    it('should create a new user successfully', async () => {
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('create', 'user', undefined, {
        email: createUserDto.email,
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockLogger.logBusiness).toHaveBeenCalledWith('created', 'user', mockUser.id, {
        email: mockUser.email,
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle bcrypt error', async () => {
      const bcryptError = new Error('Bcrypt error');
      (mockedBcrypt.hash as jest.MockedFunction<any>).mockRejectedValue(bcryptError);

      await expect(service.create(createUserDto)).rejects.toThrow(bcryptError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create user',
        bcryptError.stack,
        'UserService',
        { email: createUserDto.email },
      );
    });

    it('should handle repository save error', async () => {
      const saveError = new Error('Database error');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockRejectedValue(saveError);

      await expect(service.create(createUserDto)).rejects.toThrow(saveError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create user',
        saveError.stack,
        'UserService',
        { email: createUserDto.email },
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('find_all', 'user');
      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Found 1 users');
      expect(result).toEqual(users);
    });

    it('should handle repository error', async () => {
      const findError = new Error('Database error');
      mockUserRepository.find.mockRejectedValue(findError);

      await expect(service.findAll()).rejects.toThrow(findError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find all users',
        findError.stack,
        'UserService',
        undefined,
      );
    });

    it('should return empty array when no users found', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(mockLogger.info).toHaveBeenCalledWith('Found 0 users');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('find_one', 'user', userId);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockLogger.logBusiness).toHaveBeenCalledWith('found', 'user', userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('find_one', 'user', userId);
      // Warning log is not called because NotFoundException is thrown immediately
    });

    it('should handle repository error', async () => {
      const findError = new Error('Database error');
      mockUserRepository.findOne.mockRejectedValue(findError);

      await expect(service.findOne(userId)).rejects.toThrow(findError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find user',
        findError.stack,
        'UserService',
        { id: userId },
      );
    });
  });

  describe('findByEmail', () => {
    const email = 'test@example.com';

    it('should return user when found by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('update', 'user', userId, {
        ...updateUserDto,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateUserDto));
      expect(mockLogger.logBusiness).toHaveBeenCalledWith('updated', 'user', userId);
      expect(result).toEqual(updatedUser);
    });

    it('should hash password when updating password', async () => {
      const updateWithPassword: UpdateUserDto = {
        ...updateUserDto,
        password: 'newPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateWithPassword, password: 'hashedNewPassword' };
      mockUserRepository.save.mockResolvedValue(updatedUser);
      (mockedBcrypt.hash as jest.MockedFunction<any>).mockResolvedValue('hashedNewPassword');

      const result = await service.update(userId, updateWithPassword);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashedNewPassword',
        }),
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found for update', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
    });

    it('should handle update error', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const updateError = new Error('Update error');
      mockUserRepository.save.mockRejectedValue(updateError);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(updateError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update user',
        updateError.stack,
        'UserService',
        { id: userId, updateData: { ...updateUserDto } },
      );
    });
  });

  describe('remove', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should remove user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(mockUser);

      await service.remove(userId);

      expect(mockLogger.logBusiness).toHaveBeenCalledWith('remove', 'user', userId);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(mockLogger.logBusiness).toHaveBeenCalledWith('removed', 'user', userId);
    });

    it('should throw NotFoundException when user not found for removal', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
    });

    it('should handle removal error', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const removeError = new Error('Remove error');
      mockUserRepository.remove.mockRejectedValue(removeError);

      await expect(service.remove(userId)).rejects.toThrow(removeError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to remove user',
        removeError.stack,
        'UserService',
        { id: userId },
      );
    });
  });
});
