import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EUser } from './user.entity';

export type ThemeType = 'light' | 'dark' | 'auto';

@Entity('user_preferences')
export class UserPreferenceEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => EUser, user => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: EUser;

  @Column({ type: 'varchar', length: 10, default: 'light' })
  theme: ThemeType;

  @Column({ name: 'notification_email', type: 'boolean', default: true })
  notificationEmail: boolean;

  @Column({ name: 'notification_push', type: 'boolean', default: true })
  notificationPush: boolean;

  @Column({ name: 'notification_sms', type: 'boolean', default: false })
  notificationSms: boolean;

  @Column({ name: 'default_reminder_delay', type: 'integer', default: 3 })
  defaultReminderDelay: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ name: 'show_online_status', type: 'boolean', default: true })
  showOnlineStatus: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
