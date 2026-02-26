import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('security_policy')
export class SecurityPolicyEntity {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id!: string;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts!: number;

  @Column({ type: 'int', default: 15 })
  lockoutDurationMinutes!: number;

  @Column({ type: 'int', default: 60 })
  sessionTimeoutMinutes!: number;

  @Column({ type: 'boolean', default: true })
  requireMfaForAdmin!: boolean;

  @Column({ type: 'int', default: 8 })
  minPasswordLength!: number;

  @Column({ type: 'boolean', default: true })
  requireUppercase!: boolean;

  @Column({ type: 'boolean', default: true })
  requireNumbers!: boolean;

  @Column({ type: 'boolean', default: true })
  requireSpecialChars!: boolean;

  @Column({ type: 'int', default: 90 })
  passwordExpiryDays!: number;

  @Column({ type: 'int', default: 100 })
  rateLimitPerMinute!: number;

  @Column({ type: 'int', default: 20 })
  autoBlockAfterRequests!: number;

  @Column({ type: 'int', default: 60 })
  autoBlockDurationMinutes!: number;

  @Column({ type: 'simple-array', default: '' })
  allowedOrigins!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}