import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { PermissionEntity } from './permission.entity'
import { RoleHierarchyEntity } from './role-hierarchy.entity'
import { UserEntity } from './user.entity'

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ default: 1 })
  level: number

  @Column({ default: true })
  isActive: boolean

  @ManyToMany(
    () => PermissionEntity,
    (permission) => permission.roles,
  )
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PermissionEntity[]

  @ManyToMany(
    () => UserEntity,
    (user) => user.roles,
  )
  users: UserEntity[]

  @OneToMany(
    () => RoleHierarchyEntity,
    (hierarchy) => hierarchy.parentRole,
  )
  childRoles: RoleHierarchyEntity[]

  @OneToMany(
    () => RoleHierarchyEntity,
    (hierarchy) => hierarchy.childRole,
  )
  parentRoles: RoleHierarchyEntity[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
