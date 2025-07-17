import {
  ApiOptionalBooleanField,
  ApiOptionalEmailField,
  ApiOptionalNameField,
  ApiOptionalPasswordField,
} from '~/core/decorators'

export class UpdateUserDto {
  @ApiOptionalEmailField()
  email?: string

  @ApiOptionalNameField()
  name?: string

  @ApiOptionalPasswordField()
  password?: string

  @ApiOptionalBooleanField({ description: 'User active status' })
  isActive?: boolean
}
