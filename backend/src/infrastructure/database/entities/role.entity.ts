import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';
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
  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[];

  @OneToOne(() => RoleLimitEntity, (roleLimit) => roleLimit.role)
  roleLimit: RoleLimitEntity;
}
