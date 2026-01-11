import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository';
import { UserSessionEntity } from '../../../../../infrastructure/database/entities/user-session.entity';
import { SessionCacheService } from '../../services/session-cache.service';

@Injectable()
export class UserSessionTypeOrmRepository implements IUserSessionRepository {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly repo: Repository<UserSessionEntity>,
    private readonly sessionCache: SessionCacheService,
  ) {}
  async createSession(params: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    const session = this.repo.create({
      id: params.id,
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

    // Mettre la session en cache après création
    await this.sessionCache.cacheSession(saved);

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
    // 1. Récupérer l'ancienne session pour invalider son cache
    const oldSession = await this.repo.findOne({ where: { id: sessionId } });

    // 2. Mettre à jour en base de données
    await this.repo.update(
      { id: sessionId },
      {
        refreshTokenHash: params.refreshTokenHash,
        lastActivity: params.lastActivity,
      },
    );

    // 3. Invalider l'ancien cache
    if (oldSession) {
      await this.sessionCache.invalidateSession(oldSession.refreshTokenHash);
    }

    // 4. Récupérer et cacher la nouvelle session
    const updatedSession = await this.repo.findOne({ where: { id: sessionId } });
    if (updatedSession) {
      await this.sessionCache.cacheSession(updatedSession);
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    // 1. Récupérer la session avant révocation
    const session = await this.repo.findOne({ where: { id: sessionId } });

    // 2. Révoquer en base de données
    await this.repo.update(
      { id: sessionId },
      {
        isRevoked: true,
      },
    );

    // 3. Invalider le cache
    if (session) {
      await this.sessionCache.invalidateSession(session.refreshTokenHash);
    }
  }
  async findActiveByRefreshTokenHash(hash: string) {
    // 1. Vérifier le cache en premier
    const cachedSession = await this.sessionCache.getSession(hash);
    if (cachedSession) {
      return { id: cachedSession.id };
    }

    // 2. Si pas en cache, chercher en base de données
    const session = await this.repo.findOne({
      where: {
        refreshTokenHash: hash,
        isRevoked: false,
      },
    });

    if (!session) return null;

    // 3. Mettre en cache pour les prochains appels
    await this.sessionCache.cacheSession(session);

    return { id: session.id };
  }
}
