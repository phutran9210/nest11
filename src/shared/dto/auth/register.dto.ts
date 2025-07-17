import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsUUID } from 'class-validator'
import { ApiEmailField, ApiNameField, ApiPasswordField } from '~core/decorators'

export class RegisterDto {
  @ApiNameField({ description: 'User full name' })
  name: string

  @ApiEmailField({ description: 'User email address for registration' })
  email: string

  @ApiPasswordField({ description: 'Strong password for user account' })
  password: string

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate registrations',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'Idempotency key must be a valid UUID v4' })
  idempotencyKey?: string
}
