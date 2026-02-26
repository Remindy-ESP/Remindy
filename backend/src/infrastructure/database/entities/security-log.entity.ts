import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum SecurityEventType {
  LOGIN_SUCCESS         = 'login.success',
  LOGIN_FAILURE         = 'login.failure',
  LOGIN_BRUTE_FORCE     = 'login.brute_force',
  LOGOUT                = 'logout',
  PASSWORD_RESET        = 'password.reset',
  ADMIN_USER_BANNED     = 'admin.user.banned',
  ADMIN_USER_UNBANNED   = 'admin.user.unbanned',
  ADMIN_SESSION_REVOKED = 'admin.session.revoked',
  IP_BLOCKED            = 'ip.blocked',
  IP_UNBLOCKED          = 'ip.unblocked',
  CSRF_VIOLATION        = 'csrf.violation',
}

export enum SecuritySeverity {
  INFO     = 'info',
  WARNING  = 'warning',
  CRITICAL = 'critical',
}

@Entity('security_logs')
@Index(['eventType'])
@Index(['severity'])
@Index(['ipAddress'])
@Index(['userId'])
@Index(['isSuspicious'])
@Index(['createdAt'])
export class SecurityLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  eventType!: SecurityEventType;

  @Column({ type: 'varchar', length: 20, default: SecuritySeverity.INFO })
  severity!: SecuritySeverity;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userEmail!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isSuspicious!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}