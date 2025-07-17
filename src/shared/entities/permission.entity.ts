import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { RoleEntity } from './role.entity'

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  WEBSOCKET = 'websocket',
}

export enum PermissionResource {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  WEBSOCKET = 'websocket',
  ALL = 'all',
}

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action: PermissionAction

  @Column({
    type: 'enum',
    enum: PermissionResource,
  })
  resource: PermissionResource

  @Column({ nullable: true })
  description: string

  @Column({ default: true })
  isActive: boolean

  @ManyToMany(
    () => RoleEntity,
    (role) => role.permissions,
  )
  roles: RoleEntity[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
