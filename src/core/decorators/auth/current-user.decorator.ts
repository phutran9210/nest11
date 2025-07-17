import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { UserEntity } from '~shared/entities/user.entity'

interface AuthenticatedRequest {
  user: UserEntity
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    const user = request.user

    return data ? user[data] : user
  },
)
