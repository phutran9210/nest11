import { ApiProperty } from '@nestjs/swagger'
import { AuthUserDto } from './auth-user.dto'

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 604800,
  })
  expiresIn: number

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string

  @ApiProperty({
    description: 'Authenticated user information',
    type: AuthUserDto,
  })
  user: AuthUserDto
}
