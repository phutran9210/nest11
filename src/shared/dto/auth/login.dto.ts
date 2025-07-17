import { ApiEmailField, ApiPasswordField } from '~core/decorators'

export class LoginDto {
  @ApiEmailField({ description: 'User email address for login' })
  email: string

  @ApiPasswordField({ description: 'User password for authentication' })
  password: string
}
