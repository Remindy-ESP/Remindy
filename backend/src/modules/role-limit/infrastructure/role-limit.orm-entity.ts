import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RoleOrmEntity } from '../../role/infrastructure/role.orm-entity';

@Entity('role_limits')
export class RoleLimitOrmEntity {
  @PrimaryColumn({ type: 'text' })
  role: string;

  @Column({ type: 'integer', nullable: true })
  maxSubscriptions: number | null;

  @Column({ type: 'integer', nullable: true })
  maxDocuments: number | null;

  @Column({ type: 'integer', nullable: true })
  maxDocumentSizeMb: number | null;

  @Column({ type: 'integer', nullable: true })
  maxRemindersPerSubscription: number | null;

  @Column({ type: 'boolean', default: true })
  canExportData: boolean;

  @Column({ type: 'boolean', default: true })
  canUseOcr: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => RoleOrmEntity, role => role.limits)
  @JoinColumn({ name: 'role', referencedColumnName: 'key' })
  roleEntity: RoleOrmEntity;
}
