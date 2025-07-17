import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { plainToInstance } from 'class-transformer'
import { MESSAGES } from '~/core/constant'
import {
  ApiCreateOperation,
  ApiDeleteOperation,
  ApiGetAllOperation,
  ApiGetByIdOperation,
  ApiUpdateOperation,
} from '~/core/decorators'
import { Public } from '~core/decorators'
import { CreateUserDto } from '~shared/dto/create-user.dto'
import { UpdateUserDto } from '~shared/dto/update-user.dto'
import { UserResponseDto } from '~shared/dto/user-response.dto'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @ApiCreateOperation({
    summary: 'Create a new user',
    bodyType: CreateUserDto,
    responseType: UserResponseDto,
    description: MESSAGES.USER.CREATE_SUCCESS,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.create(createUserDto)
    return plainToInstance(UserResponseDto, user)
  }

  @Get()
  @ApiGetAllOperation({
    summary: 'Get all users',
    responseType: UserResponseDto,
    description: MESSAGES.USER.LIST_SUCCESS,
  })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll()
    return users.map((user) => plainToInstance(UserResponseDto, user))
  }

  @Get(':id')
  @ApiGetByIdOperation({
    summary: 'Get user by ID',
    responseType: UserResponseDto,
    description: MESSAGES.USER.DETAIL_SUCCESS,
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findOne(id)
    return plainToInstance(UserResponseDto, user)
  }

  @Patch(':id')
  @ApiUpdateOperation({
    summary: 'Update user by ID',
    bodyType: UpdateUserDto,
    responseType: UserResponseDto,
    description: MESSAGES.USER.UPDATE_SUCCESS,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.update(id, updateUserDto)
    return plainToInstance(UserResponseDto, user)
  }

  @Delete(':id')
  @ApiDeleteOperation({
    summary: 'Delete user by ID',
    description: MESSAGES.USER.DELETE_SUCCESS,
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.userService.remove(id)
  }
}
