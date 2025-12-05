import { AuthUser } from '../entities/auth-user.entity';

export abstract class IUserAuthRepository {
  abstract findByEmail(email: string): Promise<AuthUser | null>;

  abstract findById(id: string): Promise<AuthUser | null>;

  abstract save(user: AuthUser): Promise<AuthUser>;

  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;
}
