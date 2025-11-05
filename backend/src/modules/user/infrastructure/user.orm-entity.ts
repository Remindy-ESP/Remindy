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
import { RoleOrmEntity } from '../../role/infrastructure/role.orm-entity';
import { UserSessionOrmEntity } from '../../user-session/infrastructure/user-session.orm-entity';
import { UserPreferenceOrmEntity } from '../../user-preference/infrastructure/user-preference.orm-entity';

export enum UserStatusOrm {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  BANNED = 'banned',
  INACTIVE = 'inactive',
}

/**
 * User ORM Entity - TypeORM
 * Uniquement pour la persistance, pas de logique métier
 */
@Entity('users')
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_role', ['role'])
@Index('idx_users_status', ['status'])
@Index('idx_users_last_login', ['lastLoginAt'])
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoR2Key: string | null;

  @Column({ type: 'text', nullable: false })
  role: string;

  @Column({
    type: 'enum',
    enum: UserStatusOrm,
    default: UserStatusOrm.ACTIVE,
  })
  status: UserStatusOrm;

  @Column({ type: 'varchar', length: 50, default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  language: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaSecret: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  failedLoginCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => RoleOrmEntity, role => role.users, { eager: false })
  @JoinColumn({ name: 'role', referencedColumnName: 'key' })
  roleEntity: RoleOrmEntity;

  @OneToMany(() => UserSessionOrmEntity, session => session.user)
  sessions: UserSessionOrmEntity[];

  @OneToOne(() => UserPreferenceOrmEntity, preference => preference.user)
  preferences: UserPreferenceOrmEntity;
}
