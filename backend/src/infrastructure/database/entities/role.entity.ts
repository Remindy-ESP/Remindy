import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EUser } from './user.entity';
import { RoleLimitEntity } from './role-limit.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryColumn('text')
  key: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  // Relations
  @OneToMany(() => EUser, (user) => user.role_key)
  users: EUser[];

  @OneToOne(() => RoleLimitEntity, (roleLimit) => roleLimit.role)
  roleLimit: RoleLimitEntity;
}
