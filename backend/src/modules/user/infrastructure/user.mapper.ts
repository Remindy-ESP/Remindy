import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { Email } from '../domain/email.vo';
import { UserStatus } from '../domain/user-status.enum';
import { UserOrmEntity, UserStatusOrm } from './user.orm-entity';

/**
 * User Mapper
 * Convertit entre Domain Entity et ORM Entity
 */
@Injectable()
export class UserMapper {
  /**
   * Convertit ORM Entity → Domain Entity
   */
  toDomain(ormEntity: UserOrmEntity): User {
    return new User({
      id: ormEntity.id,
      email: new Email(ormEntity.email),
      passwordHash: ormEntity.passwordHash,
      firstName: ormEntity.firstName,
      lastName: ormEntity.lastName,
      phone: ormEntity.phone,
      photoR2Key: ormEntity.photoR2Key,
      role: ormEntity.role,
      status: this.mapStatusToDomain(ormEntity.status),
      timezone: ormEntity.timezone,
      language: ormEntity.language,
      emailVerified: ormEntity.emailVerified,
      mfaEnabled: ormEntity.mfaEnabled,
      mfaSecret: ormEntity.mfaSecret,
      lastLoginAt: ormEntity.lastLoginAt,
      failedLoginCount: ormEntity.failedLoginCount,
      passwordChangedAt: ormEntity.passwordChangedAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  /**
   * Convertit Domain Entity → ORM Entity
   */
  toOrm(domainEntity: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();

    ormEntity.id = domainEntity.getId();
    ormEntity.email = domainEntity.getEmailValue();
    ormEntity.passwordHash = domainEntity.getPasswordHash();
    ormEntity.firstName = domainEntity.getFirstName();
    ormEntity.lastName = domainEntity.getLastName();
    ormEntity.phone = domainEntity.getPhone();
    ormEntity.photoR2Key = domainEntity.getPhotoR2Key();
    ormEntity.role = domainEntity.getRole();
    ormEntity.status = this.mapStatusToOrm(domainEntity.getStatus());
    ormEntity.timezone = domainEntity.getTimezone();
    ormEntity.language = domainEntity.getLanguage();
    ormEntity.emailVerified = domainEntity.isEmailVerified();
    ormEntity.mfaEnabled = domainEntity.isMfaEnabled();
    ormEntity.mfaSecret = domainEntity.getMfaSecret();
    ormEntity.lastLoginAt = domainEntity.getLastLoginAt();
    ormEntity.failedLoginCount = domainEntity.getFailedLoginCount();
    ormEntity.passwordChangedAt = domainEntity.getPasswordChangedAt();
    ormEntity.createdAt = domainEntity.getCreatedAt();
    ormEntity.updatedAt = domainEntity.getUpdatedAt();
    ormEntity.deletedAt = domainEntity.getDeletedAt();

    return ormEntity;
  }

  /**
   * Convertit Domain Entity → ORM Entity (pour update partiel)
   * Utile pour TypeORM save() qui merge automatiquement
   */
  toOrmPartial(domainEntity: User, existingOrmEntity: UserOrmEntity): UserOrmEntity {
    existingOrmEntity.email = domainEntity.getEmailValue();
    existingOrmEntity.passwordHash = domainEntity.getPasswordHash();
    existingOrmEntity.firstName = domainEntity.getFirstName();
    existingOrmEntity.lastName = domainEntity.getLastName();
    existingOrmEntity.phone = domainEntity.getPhone();
    existingOrmEntity.photoR2Key = domainEntity.getPhotoR2Key();
    existingOrmEntity.role = domainEntity.getRole();
    existingOrmEntity.status = this.mapStatusToOrm(domainEntity.getStatus());
    existingOrmEntity.timezone = domainEntity.getTimezone();
    existingOrmEntity.language = domainEntity.getLanguage();
    existingOrmEntity.emailVerified = domainEntity.isEmailVerified();
    existingOrmEntity.mfaEnabled = domainEntity.isMfaEnabled();
    existingOrmEntity.mfaSecret = domainEntity.getMfaSecret();
    existingOrmEntity.lastLoginAt = domainEntity.getLastLoginAt();
    existingOrmEntity.failedLoginCount = domainEntity.getFailedLoginCount();
    existingOrmEntity.passwordChangedAt = domainEntity.getPasswordChangedAt();
    existingOrmEntity.updatedAt = domainEntity.getUpdatedAt();
    existingOrmEntity.deletedAt = domainEntity.getDeletedAt();

    return existingOrmEntity;
  }

  // Helper methods pour mapper les status
  private mapStatusToDomain(ormStatus: UserStatusOrm): UserStatus {
    switch (ormStatus) {
      case UserStatusOrm.ACTIVE:
        return UserStatus.ACTIVE;
      case UserStatusOrm.VERIFIED:
        return UserStatus.VERIFIED;
      case UserStatusOrm.BANNED:
        return UserStatus.BANNED;
      case UserStatusOrm.INACTIVE:
        return UserStatus.INACTIVE;
      default:
        return UserStatus.ACTIVE;
    }
  }

  private mapStatusToOrm(domainStatus: UserStatus): UserStatusOrm {
    switch (domainStatus) {
      case UserStatus.ACTIVE:
        return UserStatusOrm.ACTIVE;
      case UserStatus.VERIFIED:
        return UserStatusOrm.VERIFIED;
      case UserStatus.BANNED:
        return UserStatusOrm.BANNED;
      case UserStatus.INACTIVE:
        return UserStatusOrm.INACTIVE;
      default:
        return UserStatusOrm.ACTIVE;
    }
  }
}
