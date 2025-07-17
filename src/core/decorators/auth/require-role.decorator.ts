import { SetMetadata } from '@nestjs/common'
import { REQUIRE_ROLES_KEY } from '~core/guards/hierarchical.guard'

export const RequireRole = (role: string) => SetMetadata(REQUIRE_ROLES_KEY, [role])

export const RequireRoles = (roles: string[]) => SetMetadata(REQUIRE_ROLES_KEY, roles)

export const RequireAnyRole = (roles: string[]) => SetMetadata(REQUIRE_ROLES_KEY, roles)
