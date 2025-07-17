import { Reflector } from '@nestjs/core'
import { Test, type TestingModule } from '@nestjs/testing'
import { plainToInstance } from 'class-transformer'
import { UserController } from '~modules/user/user.controller'
import { UserService } from '~modules/user/user.service'
import type { CreateUserDto } from '~shared/dto/create-user.dto'
import type { UpdateUserDto } from '~shared/dto/update-user.dto'
import { UserResponseDto } from '~shared/dto/user-response.dto'
import type { UserEntity } from '~shared/entities/user.entity'

// Mock class-transformer
jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn(),
  Expose: () => () => {},
  Exclude: () => () => {},
}))

describe('UserController', () => {
  let controller: UserController
  let service: UserService

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  const mockUserEntity: UserEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  }

  const mockUserResponseDto: UserResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  }

  const mockCreateUserDto: CreateUserDto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
  }

  const mockUpdateUserDto: UpdateUserDto = {
    name: 'John Updated',
    email: 'john.updated@example.com',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        Reflector,
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
    service = module.get<UserService>(UserService)

    // Reset mocks
    jest.clearAllMocks()
    ;(plainToInstance as jest.Mock).mockImplementation((_cls, obj) => obj)
  })

  describe('create', () => {
    it('should create a new user', async () => {
      mockUserService.create.mockResolvedValue(mockUserEntity)

      const result = await controller.create(mockCreateUserDto)

      expect(service.create).toHaveBeenCalledWith(mockCreateUserDto)
      expect(service.create).toHaveBeenCalledTimes(1)
      expect(plainToInstance).toHaveBeenCalledWith(UserResponseDto, mockUserEntity)
      expect(result).toEqual(mockUserEntity)
    })

    it('should handle service errors', async () => {
      const error = new Error('Creation failed')
      mockUserService.create.mockRejectedValue(error)

      await expect(controller.create(mockCreateUserDto)).rejects.toThrow('Creation failed')
      expect(service.create).toHaveBeenCalledWith(mockCreateUserDto)
    })

    it('should transform entity to DTO', async () => {
      mockUserService.create.mockResolvedValue(mockUserEntity)
      ;(plainToInstance as jest.Mock).mockReturnValue(mockUserResponseDto)

      const result = await controller.create(mockCreateUserDto)

      expect(plainToInstance).toHaveBeenCalledWith(UserResponseDto, mockUserEntity)
      expect(result).toEqual(mockUserResponseDto)
    })
  })

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUserEntity, { ...mockUserEntity, id: 'another-id' }]
      mockUserService.findAll.mockResolvedValue(users)
      ;(plainToInstance as jest.Mock).mockImplementation((_cls, obj) => obj)

      const result = await controller.findAll()

      expect(service.findAll).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(2)
      expect(plainToInstance).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when no users found', async () => {
      mockUserService.findAll.mockResolvedValue([])

      const result = await controller.findAll()

      expect(service.findAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual([])
      expect(plainToInstance).not.toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      const error = new Error('Database error')
      mockUserService.findAll.mockRejectedValue(error)

      await expect(controller.findAll()).rejects.toThrow('Database error')
    })

    it('should transform all entities to DTOs', async () => {
      const users = [mockUserEntity, mockUserEntity]
      mockUserService.findAll.mockResolvedValue(users)

      await controller.findAll()

      expect(plainToInstance).toHaveBeenCalledTimes(2)
      expect(plainToInstance).toHaveBeenNthCalledWith(1, UserResponseDto, mockUserEntity)
      expect(plainToInstance).toHaveBeenNthCalledWith(2, UserResponseDto, mockUserEntity)
    })
  })

  describe('findOne', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return user by ID', async () => {
      mockUserService.findOne.mockResolvedValue(mockUserEntity)

      const result = await controller.findOne(userId)

      expect(service.findOne).toHaveBeenCalledWith(userId)
      expect(service.findOne).toHaveBeenCalledTimes(1)
      expect(plainToInstance).toHaveBeenCalledWith(UserResponseDto, mockUserEntity)
      expect(result).toEqual(mockUserEntity)
    })

    it('should handle user not found', async () => {
      const error = new Error('User not found')
      mockUserService.findOne.mockRejectedValue(error)

      await expect(controller.findOne(userId)).rejects.toThrow('User not found')
      expect(service.findOne).toHaveBeenCalledWith(userId)
    })

    it('should handle invalid ID format', async () => {
      const invalidId = 'invalid-id'
      const error = new Error('Invalid ID format')
      mockUserService.findOne.mockRejectedValue(error)

      await expect(controller.findOne(invalidId)).rejects.toThrow('Invalid ID format')
      expect(service.findOne).toHaveBeenCalledWith(invalidId)
    })
  })

  describe('update', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000'

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUserEntity, ...mockUpdateUserDto }
      mockUserService.update.mockResolvedValue(updatedUser)

      const result = await controller.update(userId, mockUpdateUserDto)

      expect(service.update).toHaveBeenCalledWith(userId, mockUpdateUserDto)
      expect(service.update).toHaveBeenCalledTimes(1)
      expect(plainToInstance).toHaveBeenCalledWith(UserResponseDto, updatedUser)
      expect(result).toEqual(updatedUser)
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      mockUserService.update.mockRejectedValue(error)

      await expect(controller.update(userId, mockUpdateUserDto)).rejects.toThrow('Update failed')
      expect(service.update).toHaveBeenCalledWith(userId, mockUpdateUserDto)
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Only Name Updated' }
      const updatedUser = { ...mockUserEntity, name: 'Only Name Updated' }
      mockUserService.update.mockResolvedValue(updatedUser)

      const result = await controller.update(userId, partialUpdate)

      expect(service.update).toHaveBeenCalledWith(userId, partialUpdate)
      expect(result).toEqual(updatedUser)
    })

    it('should handle empty update', async () => {
      const emptyUpdate = {}
      mockUserService.update.mockResolvedValue(mockUserEntity)

      const result = await controller.update(userId, emptyUpdate)

      expect(service.update).toHaveBeenCalledWith(userId, emptyUpdate)
      expect(result).toEqual(mockUserEntity)
    })
  })

  describe('remove', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000'

    it('should remove user successfully', async () => {
      mockUserService.remove.mockResolvedValue(undefined)

      const result = await controller.remove(userId)

      expect(service.remove).toHaveBeenCalledWith(userId)
      expect(service.remove).toHaveBeenCalledTimes(1)
      expect(result).toBeUndefined()
    })

    it('should handle removal errors', async () => {
      const error = new Error('Removal failed')
      mockUserService.remove.mockRejectedValue(error)

      await expect(controller.remove(userId)).rejects.toThrow('Removal failed')
      expect(service.remove).toHaveBeenCalledWith(userId)
    })

    it('should handle user not found for removal', async () => {
      const error = new Error('User not found')
      mockUserService.remove.mockRejectedValue(error)

      await expect(controller.remove(userId)).rejects.toThrow('User not found')
    })
  })

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined()
    })

    it('should have userService injected', () => {
      expect(controller.userService).toBeDefined()
      expect(controller.userService).toBe(service)
    })
  })
})
