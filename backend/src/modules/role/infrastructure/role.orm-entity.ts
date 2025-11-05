import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { UserOrmEntity } from '../../user/infrastructure/user.orm-entity';
import { RoleLimitOrmEntity } from '../../role-limit/infrastructure/role-limit.orm-entity';

@Entity('roles')
@Index('idx_roles_key', ['key'], { unique: true })
export class RoleOrmEntity {
  @PrimaryColumn({ type: 'text' })
  key: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => UserOrmEntity, user => user.roleEntity)
  users: UserOrmEntity[];

  @OneToOne(() => RoleLimitOrmEntity, limit => limit.roleEntity)
  limits: RoleLimitOrmEntity;
}
