import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';
import { EventEntity } from '../../../event/infrastructure/persistence/event.entity';
import type {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../../domain/notification.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => EUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: EUser;

  @Column({ name: 'event_id', type: 'uuid', nullable: true })
  eventId?: string;

  @ManyToOne(() => EventEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'event_id' })
  event?: EventEntity;

  @Column({ name: 'reminder_id', type: 'uuid', nullable: true })
  reminderId?: string;

  @Column({ type: 'varchar', length: 50 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 20 })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: NotificationStatus;

  @Column({ name: 'snoozed_until', type: 'timestamptz', nullable: true })
  snoozedUntil?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
