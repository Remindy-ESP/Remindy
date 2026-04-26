import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EUser } from './user.entity';

@Entity('user_sessions')
@Index('idx_user_sessions_user_id', ['userId'])
@Index('idx_user_sessions_refresh_token_hash', ['refreshTokenHash'], {
  unique: true,
})
@Index('idx_user_sessions_expires_at', ['expiresAt'])
@Index('idx_user_sessions_is_revoked', ['isRevoked'], {
  where: `"isRevoked" = false`,
})
@Index('idx_user_sessions_deleted_at', ['deletedAt'], {
  where: `"deletedAt" IS NULL`,
})
export class UserSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  refreshTokenHash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceName: string;

  @Column({ type: 'inet', nullable: false })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  lastActivity: Date;

  @Column({ type: 'timestamptz', nullable: false })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => EUser, user => user.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: EUser;
}
