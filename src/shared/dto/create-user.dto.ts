import { ApiEmailField, ApiNameField, ApiPasswordField } from '~/core/decorators';

export class CreateUserDto {
  @ApiEmailField()
  email: string;

  @ApiNameField()
  name: string;

  @ApiPasswordField()
  password: string;
}
