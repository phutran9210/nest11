import { DataSource } from 'typeorm'
import {
  PermissionAction,
  PermissionEntity,
  PermissionResource,
} from '~shared/entities/permission.entity'
import { RoleEntity } from '~shared/entities/role.entity'
import { RoleHierarchyEntity } from '~shared/entities/role-hierarchy.entity'

export async function seedRbacData(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding RBAC data...')

  const roleRepository = dataSource.getRepository(RoleEntity)
  const permissionRepository = dataSource.getRepository(PermissionEntity)
  const roleHierarchyRepository = dataSource.getRepository(RoleHierarchyEntity)

  const permissions = [
    {
      name: 'create:user',
      action: PermissionAction.CREATE,
      resource: PermissionResource.USER,
      description: 'Create new users',
    },
    {
      name: 'read:user',
      action: PermissionAction.READ,
      resource: PermissionResource.USER,
      description: 'Read user information',
    },
    {
      name: 'update:user',
      action: PermissionAction.UPDATE,
      resource: PermissionResource.USER,
      description: 'Update user information',
    },
    {
      name: 'delete:user',
      action: PermissionAction.DELETE,
      resource: PermissionResource.USER,
      description: 'Delete users',
    },
    {
      name: 'manage:role',
      action: PermissionAction.MANAGE,
      resource: PermissionResource.ROLE,
      description: 'Full role management',
    },
    {
      name: 'read:role',
      action: PermissionAction.READ,
      resource: PermissionResource.ROLE,
      description: 'Read role information',
    },
    {
      name: 'manage:permission',
      action: PermissionAction.MANAGE,
      resource: PermissionResource.PERMISSION,
      description: 'Full permission management',
    },
    {
      name: 'manage:system',
      action: PermissionAction.MANAGE,
      resource: PermissionResource.SYSTEM,
      description: 'Full system management',
    },
    {
      name: 'manage:all',
      action: PermissionAction.MANAGE,
      resource: PermissionResource.ALL,
      description: 'Full system access',
    },
  ]

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access',
      level: 1,
      permissions: ['manage:all'],
    },
    {
      name: 'Admin',
      description: 'Administrator with limited access',
      level: 2,
      permissions: ['manage:user', 'manage:role', 'read:system'],
    },
    {
      name: 'Manager',
      description: 'Manager with user management access',
      level: 3,
      permissions: ['create:user', 'read:user', 'update:user', 'read:role'],
    },
    {
      name: 'User',
      description: 'Regular user',
      level: 4,
      permissions: ['read:user'],
    },
    {
      name: 'Guest',
      description: 'Guest user with minimal access',
      level: 5,
      permissions: [],
    },
  ]

  const savedPermissions: PermissionEntity[] = []
  for (const permissionData of permissions) {
    const existingPermission = await permissionRepository.findOne({
      where: { name: permissionData.name },
    })

    if (!existingPermission) {
      const permission = permissionRepository.create(permissionData)
      const savedPermission = await permissionRepository.save(permission)
      savedPermissions.push(savedPermission)
      console.log(`✅ Created permission: ${permissionData.name}`)
    } else {
      savedPermissions.push(existingPermission)
      console.log(`🔄 Permission already exists: ${permissionData.name}`)
    }
  }

  const savedRoles: RoleEntity[] = []
  for (const roleData of roles) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleData.name },
      relations: ['permissions'],
    })

    if (!existingRole) {
      const role = roleRepository.create({
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
      })

      const rolePermissions = savedPermissions.filter((p) => roleData.permissions.includes(p.name))

      role.permissions = rolePermissions
      const savedRole = await roleRepository.save(role)
      savedRoles.push(savedRole)
      console.log(
        `✅ Created role: ${roleData.name} with ${String(rolePermissions.length)} permissions`,
      )
    } else {
      savedRoles.push(existingRole)
      console.log(`🔄 Role already exists: ${roleData.name}`)
    }
  }

  const hierarchies = [
    { parent: 'Super Admin', child: 'Admin' },
    { parent: 'Admin', child: 'Manager' },
    { parent: 'Manager', child: 'User' },
    { parent: 'User', child: 'Guest' },
  ]

  for (const hierarchy of hierarchies) {
    const parentRole = savedRoles.find((r) => r.name === hierarchy.parent)
    const childRole = savedRoles.find((r) => r.name === hierarchy.child)

    if (parentRole && childRole) {
      const existingHierarchy = await roleHierarchyRepository.findOne({
        where: {
          parentRoleId: parentRole.id,
          childRoleId: childRole.id,
        },
      })

      if (!existingHierarchy) {
        const roleHierarchy = roleHierarchyRepository.create({
          parentRoleId: parentRole.id,
          childRoleId: childRole.id,
          depth: 1,
        })

        await roleHierarchyRepository.save(roleHierarchy)
        console.log(`✅ Created role hierarchy: ${hierarchy.parent} -> ${hierarchy.child}`)
      } else {
        console.log(`🔄 Role hierarchy already exists: ${hierarchy.parent} -> ${hierarchy.child}`)
      }
    }
  }

  console.log('🎉 RBAC data seeding completed!')
}
