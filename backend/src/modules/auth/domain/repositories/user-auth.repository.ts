import { AuthUser } from '../entities/auth-user.entity';

export abstract class IUserAuthRepository {
  abstract findByEmail(email: string): Promise<AuthUser | null>;

  abstract findById(id: string): Promise<AuthUser | null>;

  abstract save(user: AuthUser): Promise<AuthUser>;

  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;

  abstract incrementFailedLoginCount(userId: string): Promise<void>;

  abstract resetFailedLoginCount(userId: string): Promise<void>;

  abstract updateLastLoginAt(userId: string, date: Date): Promise<void>;

  abstract markEmailAsVerified(userId: string): Promise<void>;
}
