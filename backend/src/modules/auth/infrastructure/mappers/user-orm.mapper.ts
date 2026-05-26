import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { EUser } from 'src/infrastructure/database/entities/user.entity';

@Injectable()
export class UserOrmMapper {
  toDomain(entity: EUser): AuthUser {
    return new AuthUser({
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash ?? null,
      role_key: entity.role_key,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      status: entity.status,
      failedLoginCount: entity.failedLoginCount,
      emailVerified: entity.emailVerified,
      mfaEnabled: entity.mfaEnabled,
      mfaSecret: entity.mfaSecret,
      createdAt: entity.createdAt,
      googleId: entity.googleId ?? null,
      microsoftId: entity.microsoftId ?? null,
      appleId: entity.appleId ?? null,
    });
  }

  toOrm(user: AuthUser): Partial<EUser> {
    return {
      email: user.getEmail(),
      passwordHash: user.getPasswordHash() ?? undefined,
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      phone: user.getPhone(),
      role_key: user.getRoleKey(),
      status: user.getStatus(),
      failedLoginCount: user.getFailedLoginCount(),
      emailVerified: user.isEmailVerified(),
      mfaEnabled: user.isMfaEnabled(),
      mfaSecret: user.getMfaSecret(),
      googleId: user.getGoogleId(),
      microsoftId: user.getMicrosoftId(),
      appleId: user.getAppleId(),
    };
  }
}
