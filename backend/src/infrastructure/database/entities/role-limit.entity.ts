import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('role_limits')
@Check(
  `(max_subscriptions IS NULL OR max_subscriptions > 0) AND
   (max_documents IS NULL OR max_documents > 0) AND
   (max_document_size_mb IS NULL OR max_document_size_mb > 0) AND
   (max_reminders_per_subscription IS NULL OR max_reminders_per_subscription > 0)`,
)
export class RoleLimitEntity {
  @PrimaryColumn('text')
  role: string;

  @Column({ type: 'integer', nullable: true })
  maxSubscriptions: number;

  @Column({ type: 'integer', nullable: true })
  maxDocuments: number;

  @Column({ type: 'integer', nullable: true })
  maxDocumentSizeMb: number;

  @Column({ type: 'integer', nullable: true })
  maxRemindersPerSubscription: number;

  @Column({ type: 'boolean', default: true })
  canExportData: boolean;

  @Column({ type: 'boolean', default: true })
  canUseOcr: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => RoleEntity, (role) => role.roleLimit, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role' })
  roleEntity: RoleEntity;
}
