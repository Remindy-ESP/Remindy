import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EUser } from './user.entity';

export type RgpdExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
export type RgpdExportFormat = 'json' | 'csv';
export type RgpdExportRequestedBy = 'user' | 'admin' | 'automated';

@Entity('rgpd_exports')
export class RgpdExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => EUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: EUser;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: RgpdExportStatus;

  @Column({ type: 'varchar', length: 10, default: 'json' })
  format: RgpdExportFormat;

  @Column({ name: 'file_r2_key', type: 'varchar', length: 500, nullable: true })
  fileR2Key?: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ name: 'signed_url', type: 'text', nullable: true })
  signedUrl?: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'requested_by', type: 'varchar', length: 20, default: 'user' })
  requestedBy: RgpdExportRequestedBy;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;
}
