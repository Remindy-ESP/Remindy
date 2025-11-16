import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('role_limits')
export class RoleLimitEntity {
  @PrimaryColumn({ type: 'text' })
  role: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role' })
  roleEntity: RoleEntity;

  @Column({ name: 'max_subscriptions', type: 'int', nullable: true })
  maxSubscriptions?: number;

  @Column({ name: 'max_documents', type: 'int', nullable: true })
  maxDocuments?: number;

  @Column({ name: 'max_document_size_mb', type: 'int', nullable: true })
  maxDocumentSizeMb?: number;

  @Column({ name: 'max_reminders_per_subscription', type: 'int', nullable: true })
  maxRemindersPerSubscription?: number;

  @Column({ name: 'can_export_data', type: 'boolean', default: true })
  canExportData: boolean;

  @Column({ name: 'can_use_ocr', type: 'boolean', default: true })
  canUseOcr: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
