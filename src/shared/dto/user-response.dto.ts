import { Exclude, Expose } from 'class-transformer';
import { ApiIdField, ApiEmailField, ApiNameField } from '~/core/decorators';

export class UserResponseDto {
  @ApiIdField({ description: 'User unique identifier' })
  @Expose()
  id: string;

  @ApiEmailField({ required: false })
  @Expose()
  email: string;

  @ApiNameField({ required: false })
  @Expose()
  name: string;

  @Exclude()
  password: string;

  @Exclude()
  isActive: boolean;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
