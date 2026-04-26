import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionEntity } from '../../../subscription/infrastructure/persistence/subscription.entity';

@Entity('event_series')
export class EventSeriesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid', unique: true })
  subscriptionId: string;

  @OneToOne(() => SubscriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: SubscriptionEntity;

  @Column({ type: 'text' })
  rrule: string;

  @Column({ name: 'dtstart', type: 'timestamptz' })
  dtstart: Date;

  @Column({ type: 'varchar', length: 50, default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'timestamptz', array: true, nullable: true })
  exdates?: Date[];

  @Column({ type: 'timestamptz', array: true, nullable: true })
  rdates?: Date[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
