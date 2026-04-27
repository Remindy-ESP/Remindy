import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { UserSessionEntity } from '../../../../infrastructure/database/entities/user-session.entity';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly sessionRepository: Repository<UserSessionEntity>,
  ) {}

  async findById(id: string): Promise<UserSessionEntity | null> {
    return this.sessionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByRefreshTokenHash(hash: string): Promise<UserSessionEntity | null> {
    return this.sessionRepository.findOne({
      where: {
        refreshTokenHash: hash,
        isRevoked: false,
        deletedAt: IsNull(),
      },
    });
  }

  async findActiveSessions(userId: string): Promise<UserSessionEntity[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        isRevoked: false,
        deletedAt: IsNull(),
      },
      order: {
        lastActivity: 'DESC',
      },
    });
  }

  async findActiveSessionsNotExpired(userId: string): Promise<UserSessionEntity[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        isRevoked: false,
        deletedAt: IsNull(),
      },
      order: {
        lastActivity: 'DESC',
      },
    });
  }

  async create(data: {
    userId: string;
    refreshTokenHash: string;
    deviceName?: string;
    ipAddress: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<UserSessionEntity> {
    const session = this.sessionRepository.create({
      ...data,
      lastActivity: new Date(),
      isRevoked: false,
    });
    return this.sessionRepository.save(session);
  }

  async updateLastActivity(id: string): Promise<void> {
    await this.sessionRepository.update({ id }, { lastActivity: new Date() });
  }

  async revokeSession(id: string): Promise<void> {
    await this.sessionRepository.update({ id }, { isRevoked: true });
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(UserSessionEntity)
      .set({ isRevoked: true })
      .where('userId = :userId', { userId })
      .andWhere('isRevoked = :isRevoked', { isRevoked: false });

    if (exceptSessionId) {
      query.andWhere('id != :exceptSessionId', { exceptSessionId });
    }

    await query.execute();
  }

  async softDelete(id: string): Promise<void> {
    await this.sessionRepository.softDelete(id);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.softDelete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async cleanupRevokedSessions(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.sessionRepository.softDelete({
      isRevoked: true,
      lastActivity: LessThan(cutoffDate),
    });
    return result.affected || 0;
  }
  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionRepository.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
