import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { UserPreferenceEntity } from './user-preference.entity';
import { RoleEntity } from './role.entity';

export type UserStatus = 'active' | 'verified' | 'banned' | 'inactive';

@Entity('users')
export class EUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'photo_r2_key', type: 'varchar', length: 500, nullable: true })
  photoR2Key?: string;

  @Column({ type: 'text' })
  role: string;

  @ManyToOne(() => RoleEntity, { eager: false })
  @JoinColumn({ name: 'role' })
  roleEntity?: RoleEntity;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: UserStatus;

  @Column({ type: 'varchar', length: 50, default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  language: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', type: 'varchar', length: 255, nullable: true })
  mfaSecret?: string;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'failed_login_count', type: 'integer', default: 0 })
  failedLoginCount: number;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => UserPreferenceEntity, (preferences) => preferences.user, {
    cascade: true,
  })
  preferences?: UserPreferenceEntity;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }
}
