import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionEntity } from '../../../subscription/infrastructure/persistence/subscription.entity';
import { ContractEntity } from '../../../../infrastructure/database/entities/contract.entity';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: SubscriptionEntity;

  @Column({ name: 'contract_id', type: 'integer', nullable: true })
  contractId?: number;

  @ManyToOne(() => ContractEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contract_id' })
  contract?: ContractEntity;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'r2_key', type: 'varchar', length: 500, unique: true })
  r2Key: string;

  @Column({ name: 'r2_bucket', type: 'varchar', length: 100, default: 'remindy-documents' })
  r2Bucket: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 64 })
  fileHash: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'ocr_text', type: 'text', nullable: true })
  ocrText?: string;

  @Column({ name: 'ocr_status', type: 'varchar', length: 20 })
  ocrStatus: OcrStatus;

  @Column({ name: 'ocr_error', type: 'text', nullable: true })
  ocrError?: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
