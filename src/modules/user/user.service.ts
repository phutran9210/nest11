import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '~shared/entities/user.entity';
import { CreateUserDto } from '~shared/dto/create-user.dto';
import { UpdateUserDto } from '~shared/dto/update-user.dto';
import { CustomLoggerService } from '~core/logger/logger.service';
import { EnvironmentService } from '~shared/services';
import * as bcrypt from 'bcrypt';

abstract class BaseService {
  protected readonly logger: CustomLoggerService;

  protected constructor(logger: CustomLoggerService) {
    this.logger = logger;
  }

  protected async handleOperation<T>(
    operation: () => Promise<T>,
    context: string,
    errorMessage: string,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : String(error);
      this.logger.error(errorMessage, errorStack, context, metadata);
      throw error;
    }
  }
}

class PasswordService {
  static async hash(password: string, saltRounds: number = 10): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }
}

class UserValidationService {
  static validateUserExists(user: UserEntity | null, id: string): UserEntity {
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}

@Injectable()
export class UserService extends BaseService {
  private readonly userRepository: Repository<UserEntity>;
  private readonly environmentService: EnvironmentService;

  constructor(
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
    logger: CustomLoggerService,
    environmentService: EnvironmentService,
  ) {
    super(logger);
    this.userRepository = userRepository;
    this.environmentService = environmentService;
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.handleOperation(
      async () => {
        this.logger.logBusiness('create', 'user', undefined, { email: createUserDto.email });

        const hashedPassword = await PasswordService.hash(
          createUserDto.password,
          this.environmentService.security.saltRounds,
        );
        const user = this.userRepository.create({
          ...createUserDto,
          password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        this.logger.logBusiness('created', 'user', savedUser.id, { email: savedUser.email });
        return savedUser;
      },
      'UserService',
      'Failed to create user',
      { email: createUserDto.email },
    );
  }

  async findAll(): Promise<UserEntity[]> {
    return this.handleOperation(
      async () => {
        this.logger.logBusiness('find_all', 'user');
        const users = await this.userRepository.find();
        this.logger.info(`Found ${users.length} users`);
        return users;
      },
      'UserService',
      'Failed to find all users',
    );
  }

  async findOne(id: string): Promise<UserEntity> {
    return this.handleOperation(
      async () => {
        this.logger.logBusiness('find_one', 'user', id);
        const user = await this.userRepository.findOne({ where: { id } });

        const validatedUser = UserValidationService.validateUserExists(user, id);
        if (!user) {
          this.logger.warn(`User not found with ID: ${id}`, 'UserService');
        }

        this.logger.logBusiness('found', 'user', id);
        return validatedUser;
      },
      'UserService',
      'Failed to find user',
      { id },
    );
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    return this.handleOperation(
      async () => {
        this.logger.logBusiness('update', 'user', id, { ...updateUserDto });
        const user = await this.findOne(id);

        const processedDto = await this.processUpdateDto(updateUserDto);
        Object.assign(user, processedDto);

        const updatedUser = await this.userRepository.save(user);
        this.logger.logBusiness('updated', 'user', id);
        return updatedUser;
      },
      'UserService',
      'Failed to update user',
      { id, updateData: { ...updateUserDto } },
    );
  }

  private async processUpdateDto(updateUserDto: UpdateUserDto): Promise<UpdateUserDto> {
    const processedDto = { ...updateUserDto };
    if (processedDto.password) {
      processedDto.password = await PasswordService.hash(
        processedDto.password,
        this.environmentService.security.saltRounds,
      );
    }
    return processedDto;
  }

  async remove(id: string): Promise<void> {
    await this.handleOperation(
      async () => {
        this.logger.logBusiness('remove', 'user', id);
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
        this.logger.logBusiness('removed', 'user', id);
      },
      'UserService',
      'Failed to remove user',
      { id },
    );
  }
}
