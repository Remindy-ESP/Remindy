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
import { EUser } from '../../../../infrastructure/database/entities/user.entity';
import { ContractEntity } from '../../../../infrastructure/database/entities/contract.entity';
import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => EUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: EUser;

  @Column({ name: 'contract_id', type: 'integer', nullable: true })
  contractId?: number;

  @ManyToOne(() => ContractEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contract_id' })
  contract?: ContractEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  frequency: SubscriptionFrequency;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate: Date;

  @Column({ name: 'trial_start_date', type: 'date', nullable: true })
  trialStartDate?: Date;

  @Column({ name: 'trial_end_date', type: 'date', nullable: true })
  trialEndDate?: Date;

  @Column({
    name: 'is_trial_active',
    type: 'boolean',
    generatedType: 'STORED',
    asExpression: `trial_end_date IS NOT NULL AND trial_end_date >= CURRENT_DATE`,
    insert: false,
    update: false,
  })
  isTrialActive: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: SubscriptionStatus;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
