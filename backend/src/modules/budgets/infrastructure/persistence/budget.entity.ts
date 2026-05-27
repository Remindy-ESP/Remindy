import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';
import { CategoryEntity } from '../../../category/infrastructure/persistence/category.entity';
import { SubscriptionEntity } from '../../../subscription/infrastructure/persistence/subscription.entity';

export type BudgetPeriodColumn = 'monthly' | 'yearly';

@Entity('budgets')
@Index('idx_budgets_user_id', ['userId'])
@Index('idx_budgets_category_id', ['categoryId'])
@Index('idx_budgets_active', ['isActive'])
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => EUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: EUser;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  period: BudgetPeriodColumn;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToMany(() => SubscriptionEntity, { eager: false })
  @JoinTable({
    name: 'budget_subscriptions',
    joinColumn: { name: 'budget_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'subscription_id', referencedColumnName: 'id' },
  })
  subscriptions?: SubscriptionEntity[];
}
