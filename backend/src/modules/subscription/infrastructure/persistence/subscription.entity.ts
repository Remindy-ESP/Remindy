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
import { CategoryEntity } from '../../../category/infrastructure/persistence/category.entity';
import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';
import { isTrialActive as checkTrialActive } from '../../../../utils/date.utils';

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

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => CategoryEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  frequency: SubscriptionFrequency;

  @Column({
    name: 'start_date',
    type: 'date',
    transformer: {
      to: (value: Date | string) => value,
      from: (value: Date) => value?.toISOString?.() || value,
    },
  })
  startDate: Date;

  @Column({
    name: 'next_due_date',
    type: 'date',
    transformer: {
      to: (value: Date | string) => value,
      from: (value: Date) => value?.toISOString?.() || value,
    },
  })
  nextDueDate: Date;

  @Column({
    name: 'trial_start_date',
    type: 'date',
    nullable: true,
    transformer: {
      to: (value: Date | string) => value,
      from: (value: Date) => value?.toISOString?.() || value,
    },
  })
  trialStartDate?: Date;

  @Column({
    name: 'trial_end_date',
    type: 'date',
    nullable: true,
    transformer: {
      to: (value: Date | string) => value,
      from: (value: Date) => value?.toISOString?.() || value,
    },
  })
  trialEndDate?: Date;

  get isTrialActive(): boolean {
    return checkTrialActive(this.trialEndDate);
  }

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
