import { UserPresenter } from './user.presenter';
import { EUser, UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

describe('UserPresenter', () => {
  describe('toMe', () => {
    const baseUser: Partial<EUser> = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      photoR2Key: 'users/user-123/photo.jpg',
      role_key: Role.USER_PREMIUM,
      status: UserStatus.VERIFIED,
      timezone: 'Europe/Paris',
      language: 'fr',
      emailVerified: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('should map a full user to UserMeResponseDto', () => {
      const result = UserPresenter.toMe(baseUser as EUser);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        photoR2Key: 'users/user-123/photo.jpg',
        role: Role.USER_PREMIUM,
        status: UserStatus.VERIFIED,
        timezone: 'Europe/Paris',
        language: 'fr',
        emailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should map null firstName to undefined', () => {
      const user = { ...baseUser, firstName: null } as unknown as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.firstName).toBeUndefined();
    });

    it('should map null lastName to undefined', () => {
      const user = { ...baseUser, lastName: null } as unknown as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.lastName).toBeUndefined();
    });

    it('should map null phone to undefined', () => {
      const user = { ...baseUser, phone: null } as unknown as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.phone).toBeUndefined();
    });

    it('should map null photoR2Key to undefined', () => {
      const user = { ...baseUser, photoR2Key: null } as unknown as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.photoR2Key).toBeUndefined();
    });

    it('should correctly map the role_key to role', () => {
      const user = { ...baseUser, role_key: Role.SUPER_ADMIN } as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.role).toBe(Role.SUPER_ADMIN);
    });

    it('should map user with active status', () => {
      const user = { ...baseUser, status: UserStatus.ACTIVE } as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.status).toBe(UserStatus.ACTIVE);
    });

    it('should map user with emailVerified false', () => {
      const user = { ...baseUser, emailVerified: false } as EUser;

      const result = UserPresenter.toMe(user);

      expect(result.emailVerified).toBe(false);
    });

    it('should not include photoUrl in output by default', () => {
      const result = UserPresenter.toMe(baseUser as EUser);

      expect(result.photoUrl).toBeUndefined();
    });
  });
});
