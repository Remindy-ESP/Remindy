import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserSessionEntity } from './user-session.entity';
import { UserPreferenceEntity } from './user-preference.entity';

export enum UserStatus {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  BANNED = 'banned',
  INACTIVE = 'inactive',
}

@Entity('users')
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
@Index('idx_users_deleted_at', ['deletedAt'])
@Index('idx_users_last_login', ['lastLoginAt'])
@Index('idx_users_failed_login', ['failedLoginCount'])
export class EUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoR2Key: string;

  @Column({ type: 'text', nullable: false })
  role: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 50, default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  language: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaSecret: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'integer', default: 0 })
  failedLoginCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role', referencedColumnName: 'key' })
  roleEntity: RoleEntity;

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions: UserSessionEntity[];

  @OneToOne(() => UserPreferenceEntity, (preference) => preference.user)
  preferences: UserPreferenceEntity;
}
