import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BlockReason {
  BRUTE_FORCE = 'brute_force',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MANUAL = 'manual',
  RATE_LIMIT = 'rate_limit',
  CSRF_ATTACK = 'csrf_attack',
}

@Entity('blocked_ips')
@Index(['ipAddress'], { unique: true })
@Index(['isActive'])
@Index(['blockedUntil'])
export class BlockedIpEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress!: string;

  @Column({ type: 'varchar', length: 40 })
  reason!: BlockReason;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** null = blocage permanent */
  @Column({ type: 'timestamptz', nullable: true })
  blockedUntil!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** null = auto-blocage */
  @Column({ type: 'uuid', nullable: true })
  blockedBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
