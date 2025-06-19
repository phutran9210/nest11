import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('role_hierarchies')
@Unique(['parentRoleId', 'childRoleId'])
export class RoleHierarchyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_role_id' })
  parentRoleId: string;

  @Column({ name: 'child_role_id' })
  childRoleId: string;

  @Column({ default: 1 })
  depth: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => RoleEntity, (role) => role.childRoles)
  @JoinColumn({ name: 'parent_role_id' })
  parentRole: RoleEntity;

  @ManyToOne(() => RoleEntity, (role) => role.parentRoles)
  @JoinColumn({ name: 'child_role_id' })
  childRole: RoleEntity;

  @CreateDateColumn()
  createdAt: Date;
}
