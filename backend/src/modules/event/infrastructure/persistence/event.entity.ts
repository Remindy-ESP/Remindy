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

export type EventStatus = 'scheduled' | 'completed' | 'canceled' | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: SubscriptionEntity;

  @Column({ name: 'event_series_id', type: 'uuid', nullable: true })
  eventSeriesId?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount: number;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: EventStatus;

  @Column({ name: 'payment_status', type: 'varchar', length: 20, nullable: true })
  paymentStatus?: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
