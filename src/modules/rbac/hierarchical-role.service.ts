import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, type Repository } from 'typeorm'
import type { CustomLoggerService } from '~core/logger/logger.service'
import {
  PermissionAction,
  PermissionEntity,
  PermissionResource,
} from '~shared/entities/permission.entity'
import { RoleEntity } from '~shared/entities/role.entity'
import { RoleHierarchyEntity } from '~shared/entities/role-hierarchy.entity'
import { UserEntity } from '~shared/entities/user.entity'

export interface UserPermissions {
  userId: string
  roles: string[]
  permissions: string[]
  allPermissions: PermissionEntity[]
}

@Injectable()
export class HierarchicalRoleService {
  private readonly roleRepository: Repository<RoleEntity>
  private readonly permissionRepository: Repository<PermissionEntity>
  private readonly roleHierarchyRepository: Repository<RoleHierarchyEntity>
  private readonly userRepository: Repository<UserEntity>
  private readonly logger: CustomLoggerService

  constructor(
    @InjectRepository(RoleEntity)
    roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RoleHierarchyEntity)
    roleHierarchyRepository: Repository<RoleHierarchyEntity>,
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
    logger: CustomLoggerService,
  ) {
    this.roleRepository = roleRepository
    this.permissionRepository = permissionRepository
    this.roleHierarchyRepository = roleHierarchyRepository
    this.userRepository = userRepository
    this.logger = logger
  }

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    })

    if (!user) {
      return {
        userId,
        roles: [],
        permissions: [],
        allPermissions: [],
      }
    }

    const directRoles = user.roles || []
    const allRoles = await this.getAllInheritedRoles(directRoles.map((r) => r.id))
    const allPermissions = await this.getAllPermissionsFromRoles(allRoles.map((r) => r.id))

    return {
      userId,
      roles: allRoles.map((r) => r.name),
      permissions: allPermissions.map((p) => p.name),
      allPermissions,
    }
  }

  async getAllInheritedRoles(roleIds: string[]): Promise<RoleEntity[]> {
    if (!roleIds.length) return []

    const visited = new Set<string>()
    const allRoles: RoleEntity[] = []

    const processRoles = async (currentRoleIds: string[]) => {
      const newRoleIds = currentRoleIds.filter((id) => !visited.has(id))
      if (!newRoleIds.length) return

      newRoleIds.forEach((id) => visited.add(id))

      const roles = await this.roleRepository.find({
        where: { id: In(newRoleIds), isActive: true },
        relations: ['permissions'],
      })

      allRoles.push(...roles)

      const hierarchies = await this.roleHierarchyRepository.find({
        where: { childRoleId: In(newRoleIds), isActive: true },
        relations: ['parentRole'],
      })

      const parentRoleIds = hierarchies.map((h) => h.parentRoleId).filter((id) => !visited.has(id))

      if (parentRoleIds.length) {
        await processRoles(parentRoleIds)
      }
    }

    await processRoles(roleIds)
    return allRoles
  }

  async getAllPermissionsFromRoles(roleIds: string[]): Promise<PermissionEntity[]> {
    if (!roleIds.length) return []

    const roles = await this.roleRepository.find({
      where: { id: In(roleIds), isActive: true },
      relations: ['permissions'],
    })

    const permissionSet = new Set<string>()
    const permissions: PermissionEntity[] = []

    roles.forEach((role) => {
      role.permissions?.forEach((permission) => {
        if (permission.isActive && !permissionSet.has(permission.id)) {
          permissionSet.add(permission.id)
          permissions.push(permission)
        }
      })
    })

    return permissions
  }

  async hasPermission(
    userId: string,
    action: PermissionAction,
    resource: PermissionResource,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)

    return userPermissions.allPermissions.some((permission) => {
      return (
        (permission.action === action &&
          (permission.resource === resource || permission.resource === PermissionResource.ALL)) ||
        (permission.action === PermissionAction.MANAGE &&
          (permission.resource === resource || permission.resource === PermissionResource.ALL))
      )
    })
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return userPermissions.roles.includes(roleName)
  }

  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return roleNames.some((roleName) => userPermissions.roles.includes(roleName))
  }

  async createRoleHierarchy(
    parentRoleId: string,
    childRoleId: string,
  ): Promise<RoleHierarchyEntity> {
    if (parentRoleId === childRoleId) {
      throw new Error('Role cannot be its own parent')
    }

    const existingHierarchy = await this.roleHierarchyRepository.findOne({
      where: { parentRoleId, childRoleId },
    })

    if (existingHierarchy) {
      throw new Error('Role hierarchy already exists')
    }

    const wouldCreateCycle = await this.wouldCreateCycle(parentRoleId, childRoleId)
    if (wouldCreateCycle) {
      throw new Error('Role hierarchy would create a cycle')
    }

    const hierarchy = this.roleHierarchyRepository.create({
      parentRoleId,
      childRoleId,
      depth: 1,
    })

    const savedHierarchy = await this.roleHierarchyRepository.save(hierarchy)

    this.logger.logBusiness('role_hierarchy_created', 'rbac', undefined, {
      parentRoleId,
      childRoleId,
    })

    return savedHierarchy
  }

  private async wouldCreateCycle(parentRoleId: string, childRoleId: string): Promise<boolean> {
    const childRoles = await this.getAllChildRoles(parentRoleId)
    return childRoles.some((role) => role.id === childRoleId)
  }

  private async getAllChildRoles(roleId: string): Promise<RoleEntity[]> {
    const visited = new Set<string>()
    const allChildRoles: RoleEntity[] = []

    const processChildren = async (currentRoleId: string) => {
      if (visited.has(currentRoleId)) return
      visited.add(currentRoleId)

      const hierarchies = await this.roleHierarchyRepository.find({
        where: { parentRoleId: currentRoleId, isActive: true },
        relations: ['childRole'],
      })

      for (const hierarchy of hierarchies) {
        if (hierarchy.childRole && !visited.has(hierarchy.childRole.id)) {
          allChildRoles.push(hierarchy.childRole)
          await processChildren(hierarchy.childRole.id)
        }
      }
    }

    await processChildren(roleId)
    return allChildRoles
  }

  async removeRoleHierarchy(parentRoleId: string, childRoleId: string): Promise<void> {
    const hierarchy = await this.roleHierarchyRepository.findOne({
      where: { parentRoleId, childRoleId },
    })

    if (hierarchy) {
      await this.roleHierarchyRepository.remove(hierarchy)

      this.logger.logBusiness('role_hierarchy_removed', 'rbac', undefined, {
        parentRoleId,
        childRoleId,
      })
    }
  }

  async getRoleHierarchy(roleId: string): Promise<{
    role: RoleEntity
    parents: RoleEntity[]
    children: RoleEntity[]
  }> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    })

    if (!role) {
      throw new Error('Role not found')
    }

    const parentHierarchies = await this.roleHierarchyRepository.find({
      where: { childRoleId: roleId, isActive: true },
      relations: ['parentRole'],
    })

    const childHierarchies = await this.roleHierarchyRepository.find({
      where: { parentRoleId: roleId, isActive: true },
      relations: ['childRole'],
    })

    return {
      role,
      parents: parentHierarchies.map((h) => h.parentRole).filter(Boolean),
      children: childHierarchies.map((h) => h.childRole).filter(Boolean),
    }
  }
}
