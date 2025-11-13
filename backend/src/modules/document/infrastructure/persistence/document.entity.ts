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
import { FolderEntity } from '../../../folder/infrastructure/persistence/folder.entity';

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

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId?: string;

  @ManyToOne(() => FolderEntity, folder => folder.documents, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folder_id' })
  folder?: FolderEntity;

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

  // Champs parsed par Gemini (Ticket 3)
  @Column({ name: 'parsed_provider', type: 'varchar', length: 255, nullable: true })
  parsedProvider?: string;

  @Column({ name: 'parsed_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  parsedAmount?: number;

  @Column({ name: 'parsed_currency', type: 'varchar', length: 3, nullable: true })
  parsedCurrency?: string;

  @Column({ name: 'parsed_date', type: 'date', nullable: true })
  parsedDate?: Date;

  @Column({ name: 'parsed_frequency', type: 'varchar', length: 50, nullable: true })
  parsedFrequency?: string;

  @Column({ name: 'parsed_category', type: 'varchar', length: 50, nullable: true })
  parsedCategory?: string;

  @Column({ name: 'parsing_confidence', type: 'float', nullable: true })
  parsingConfidence?: number;
}
