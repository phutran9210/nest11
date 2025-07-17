import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CustomLoggerService } from '~core/logger/logger.service'
import { HierarchicalRoleService } from '~modules/rbac/hierarchical-role.service'
import { PermissionAction, PermissionResource } from '~shared/entities/permission.entity'

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions'
export const REQUIRE_ROLES_KEY = 'requireRoles'

export interface RequiredPermission {
  action: PermissionAction
  resource: PermissionResource
}

@Injectable()
export class HierarchicalGuard implements CanActivate {
  private readonly reflector: Reflector
  private readonly hierarchicalRoleService: HierarchicalRoleService
  private readonly logger: CustomLoggerService

  constructor(
    reflector: Reflector,
    hierarchicalRoleService: HierarchicalRoleService,
    logger: CustomLoggerService,
  ) {
    this.reflector = reflector
    this.hierarchicalRoleService = hierarchicalRoleService
    this.logger = logger
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user?.id) {
      return false
    }

    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(REQUIRE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermissions?.length && !requiredRoles?.length) {
      return true
    }

    try {
      const hasRequiredPermissions = await this.checkPermissions(user.id, requiredPermissions || [])

      const hasRequiredRoles = await this.checkRoles(user.id, requiredRoles || [])

      const hasAccess = hasRequiredPermissions && hasRequiredRoles

      if (!hasAccess) {
        this.logger.warn(
          `Access denied for user ${user.id}. Required permissions: ${JSON.stringify(requiredPermissions)}, Required roles: ${JSON.stringify(requiredRoles)}`,
          'HierarchicalGuard',
        )

        throw new ForbiddenException('Insufficient permissions')
      }

      this.logger.logBusiness('access_granted', 'rbac', user.id, {
        requiredPermissions: requiredPermissions?.map((p) => `${p.action}:${p.resource}`),
        requiredRoles,
      })

      return true
    } catch (error) {
      this.logger.error(
        `Error checking permissions for user ${user.id}`,
        error instanceof Error ? error.message : String(error),
        'HierarchicalGuard',
      )

      if (error instanceof ForbiddenException) {
        throw error
      }

      return false
    }
  }

  private async checkPermissions(
    userId: string,
    requiredPermissions: RequiredPermission[],
  ): Promise<boolean> {
    if (!requiredPermissions.length) {
      return true
    }

    for (const permission of requiredPermissions) {
      const hasPermission = await this.hierarchicalRoleService.hasPermission(
        userId,
        permission.action,
        permission.resource,
      )

      if (!hasPermission) {
        return false
      }
    }

    return true
  }

  private async checkRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    if (!requiredRoles.length) {
      return true
    }

    return this.hierarchicalRoleService.hasAnyRole(userId, requiredRoles)
  }
}
