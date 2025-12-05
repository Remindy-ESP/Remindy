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
  `("maxSubscriptions" IS NULL OR "maxSubscriptions" > 0) AND
   ("maxDocuments" IS NULL OR "maxDocuments" > 0) AND
   ("maxDocumentSizeMb" IS NULL OR "maxDocumentSizeMb" > 0) AND
   ("maxRemindersPerSubscription" IS NULL OR "maxRemindersPerSubscription" > 0)`,
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
  @OneToOne(() => RoleEntity, role => role.roleLimit, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role' })
  roleEntity: RoleEntity;
}
