import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository';
import { UserSessionEntity } from '../../../../../infrastructure/database/entities/user-session.entity';

@Injectable()
export class UserSessionTypeOrmRepository implements IUserSessionRepository {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly repo: Repository<UserSessionEntity>,
  ) {}
  async createSession(params: {
    userId: string;
    refreshTokenHash: string;
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    const session = this.repo.create({
      userId: params.userId,
      refreshTokenHash: params.refreshTokenHash,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent ?? null,
      deviceName: params.deviceName ?? null,
      expiresAt: params.expiresAt,
      lastActivity: new Date(),
      isRevoked: false,
    } as Partial<UserSessionEntity>);

    const saved = await this.repo.save(session);
    return { id: saved.id };
  }
  async findActiveSessionById(sessionId: string): Promise<{
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
  } | null> {
    const session = await this.repo.findOne({
      where: {
        id: sessionId,
        isRevoked: false,
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      isRevoked: session.isRevoked,
    };
  }

  async updateRefreshToken(
    sessionId: string,
    params: {
      refreshTokenHash: string;
      lastActivity: Date;
    },
  ): Promise<void> {
    await this.repo.update(
      { id: sessionId },
      {
        refreshTokenHash: params.refreshTokenHash,
        lastActivity: params.lastActivity,
      },
    );
  }
  async revokeSession(sessionId: string): Promise<void> {
    await this.repo.update(
      { id: sessionId },
      {
        isRevoked: true,
      },
    );
  }
  async findActiveByRefreshTokenHash(hash: string) {
    const session = await this.repo.findOne({
      where: {
        refreshTokenHash: hash,
        isRevoked: false,
      },
    });

    if (!session) return null;

    return { id: session.id };
  }
}
