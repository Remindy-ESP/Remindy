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

@Entity('role_permissions')
@Unique('uq_role_permission', ['roleKey', 'permission'])
export class RolePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_key', type: 'text' })
  roleKey: string;

  @Column({ type: 'varchar', length: 100 })
  permission: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_key', referencedColumnName: 'key' })
  role: RoleEntity;
}
