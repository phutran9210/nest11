import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class AuthUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Expose()
  name: string

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Expose()
  email: string

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date

  @ApiProperty({
    description: 'Account last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date
}
