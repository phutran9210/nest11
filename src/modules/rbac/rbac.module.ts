import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CoreModule } from '~core/core.module'
import { HierarchicalGuard } from '~core/guards/hierarchical.guard'
import { PermissionEntity } from '~shared/entities/permission.entity'
import { RoleEntity } from '~shared/entities/role.entity'
import { RoleHierarchyEntity } from '~shared/entities/role-hierarchy.entity'
import { UserEntity } from '~shared/entities/user.entity'
import { HierarchicalRoleService } from './hierarchical-role.service'
import { RbacController } from './rbac.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, PermissionEntity, RoleHierarchyEntity, UserEntity]),
    CoreModule,
  ],
  controllers: [RbacController],
  providers: [HierarchicalRoleService, HierarchicalGuard],
  exports: [HierarchicalRoleService, HierarchicalGuard],
})
export class RbacModule {}
