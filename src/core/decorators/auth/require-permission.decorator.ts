import { SetMetadata } from '@nestjs/common'
import { REQUIRE_PERMISSIONS_KEY, type RequiredPermission } from '~core/guards/hierarchical.guard'
import type { PermissionAction, PermissionResource } from '~shared/entities/permission.entity'

export const RequirePermission = (action: PermissionAction, resource: PermissionResource) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, [{ action, resource }])

export const RequirePermissions = (permissions: RequiredPermission[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions)
