import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { EUser } from './user.entity';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

@Entity('user_preferences')
@Check('"defaultReminderDelay" BETWEEN 1 AND 365')
export class UserPreferenceEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: Theme,
    default: Theme.LIGHT,
  })
  theme: Theme;

  @Column({ type: 'boolean', default: true })
  notificationEmail: boolean;

  @Column({ type: 'boolean', default: true })
  notificationPush: boolean;

  @Column({ type: 'boolean', default: false })
  notificationSms: boolean;

  @Column({ type: 'integer', default: 3 })
  defaultReminderDelay: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  showOnlineStatus: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  // Relations
  @OneToOne(() => EUser, user => user.preferences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: EUser;
}
