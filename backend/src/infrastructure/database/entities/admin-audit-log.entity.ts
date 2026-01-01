import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EUser } from './user.entity';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';

@Entity('admin_audit_log')
@Index('idx_admin_audit_log_actor_user_id', ['actorUserId'])
@Index('idx_admin_audit_log_action', ['action'])
@Index('idx_admin_audit_log_resource_type', ['resourceType'])
@Index('idx_admin_audit_log_severity', ['severity'])
@Index('idx_admin_audit_log_success', ['success'])
@Index('idx_admin_audit_log_created_at', ['createdAt'])
export class AdminAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  action: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 50, nullable: false })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: Severity.INFO,
  })
  severity: Severity;

  @Column({ type: 'boolean', nullable: false, default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => EUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actor: EUser | null;
}
