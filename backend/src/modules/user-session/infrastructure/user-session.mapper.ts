import { Injectable } from '@nestjs/common';
import { UserSession } from '../domain/user-session.entity';
import { UserSessionOrmEntity } from './user-session.orm-entity';

@Injectable()
export class UserSessionMapper {
  toDomain(ormEntity: UserSessionOrmEntity): UserSession {
    return new UserSession({
      id: ormEntity.id,
      userId: ormEntity.userId,
      refreshTokenHash: ormEntity.refreshTokenHash,
      deviceName: ormEntity.deviceName,
      ipAddress: ormEntity.ipAddress,
      userAgent: ormEntity.userAgent,
      lastActivity: ormEntity.lastActivity,
      expiresAt: ormEntity.expiresAt,
      isRevoked: ormEntity.isRevoked,
      createdAt: ormEntity.createdAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  toOrm(domainEntity: UserSession): UserSessionOrmEntity {
    const ormEntity = new UserSessionOrmEntity();
    ormEntity.id = domainEntity.getId();
    ormEntity.userId = domainEntity.getUserId();
    ormEntity.refreshTokenHash = domainEntity.getRefreshTokenHash();
    ormEntity.deviceName = domainEntity.getDeviceName();
    ormEntity.ipAddress = domainEntity.getIpAddress();
    ormEntity.userAgent = domainEntity.getUserAgent();
    ormEntity.lastActivity = domainEntity.getLastActivity();
    ormEntity.expiresAt = domainEntity.getExpiresAt();
    ormEntity.isRevoked = domainEntity.revoked();
    ormEntity.createdAt = domainEntity.getCreatedAt();
    ormEntity.deletedAt = domainEntity.getDeletedAt();
    return ormEntity;
  }
}
