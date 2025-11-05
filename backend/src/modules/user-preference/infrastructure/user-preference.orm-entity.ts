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
import { UserOrmEntity } from '../../user/infrastructure/user.orm-entity';

export enum ThemeOrm {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

@Entity('user_preferences')
export class UserPreferenceOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ThemeOrm,
    default: ThemeOrm.LIGHT,
  })
  theme: ThemeOrm;

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => UserOrmEntity, user => user.preferences)
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;
}
