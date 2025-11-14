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
      userAgent: params.userAgent,
      deviceName: params.deviceName,
      expiresAt: params.expiresAt,
      lastActivity: new Date(),
      isRevoked: false,
    });

    const saved = await this.repo.save(session);
    return { id: saved.id };
  }
}
