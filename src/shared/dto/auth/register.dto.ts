import { ApiEmailField, ApiPasswordField, ApiNameField } from '~core/decorators';

export class RegisterDto {
  @ApiNameField({ description: 'User full name' })
  name: string;

  @ApiEmailField({ description: 'User email address for registration' })
  email: string;

  @ApiPasswordField({ description: 'Strong password for user account' })
  password: string;
}
