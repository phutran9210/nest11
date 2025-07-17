import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiCreateOperation, ClientIp, CurrentUser, Public } from '~core/decorators'
import { AuthResponseDto, type LoginDto, type RefreshTokenDto, RegisterDto } from '~shared/dto/auth'
import type { UserEntity } from '~shared/entities/user.entity'
import type { AuthService } from './auth.service'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email and password',
    bodyType: RegisterDto,
    responseType: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many login attempts',
  })
  async login(@Body() loginDto: LoginDto, @ClientIp() ipAddress: string): Promise<AuthResponseDto> {
    // Check rate limits before attempting login
    await this.authService.checkLoginRateLimit(ipAddress, loginDto.email)

    return this.authService.login(loginDto, ipAddress)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout user and blacklist current access token',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User logged out successfully',
  })
  async logout(
    @CurrentUser() user: UserEntity,
    @Headers('authorization') authorization: string,
  ): Promise<void> {
    const token = authorization?.replace('Bearer ', '') || ''
    await this.authService.logout(user, token)
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Logout user from all devices and invalidate all tokens',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User logged out from all devices successfully',
  })
  async logoutAll(@CurrentUser() user: UserEntity): Promise<void> {
    await this.authService.logoutAll(user)
  }
}
