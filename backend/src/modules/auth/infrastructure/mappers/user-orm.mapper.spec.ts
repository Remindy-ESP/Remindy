import { UserOrmMapper } from './user-orm.mapper';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { EUser, UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';

describe('UserOrmMapper', () => {
  let mapper: UserOrmMapper;

  beforeEach(() => {
    mapper = new UserOrmMapper();
  });

  describe('toDomain', () => {
    it('should map EUser entity to AuthUser domain', () => {
      const entity = new EUser();
      entity.id = 'user-123';
      entity.email = 'test@example.com';
      entity.passwordHash = 'hashed_password';
      entity.role_key = Role.USER_FREEMIUM;
      entity.firstName = 'John';
      entity.lastName = 'Doe';
      entity.phone = '+1234567890';
      entity.status = UserStatus.ACTIVE;
      entity.failedLoginCount = 0;
      entity.emailVerified = true;
      entity.mfaEnabled = false;
      entity.mfaSecret = undefined;
      entity.createdAt = new Date('2024-01-01');

      const domain = mapper.toDomain(entity);

      expect(domain).toBeInstanceOf(AuthUser);
      expect(domain.getId()).toBe('user-123');
      expect(domain.getEmail()).toBe('test@example.com');
      expect(domain.getPasswordHash()).toBe('hashed_password');
      expect(domain.getRoleKey()).toBe(Role.USER_FREEMIUM);
      expect(domain.getFirstName()).toBe('John');
      expect(domain.getLastName()).toBe('Doe');
      expect(domain.getPhone()).toBe('+1234567890');
      expect(domain.getStatus()).toBe(UserStatus.ACTIVE);
      expect(domain.getFailedLoginCount()).toBe(0);
      expect(domain.isEmailVerified()).toBe(true);
      expect(domain.isMfaEnabled()).toBe(false);
      expect(domain.getMfaSecret()).toBeUndefined();
      expect(domain.getCreatedAt()).toEqual(new Date('2024-01-01'));
    });

    it('should map EUser with MFA enabled', () => {
      const entity = new EUser();
      entity.id = 'user-456';
      entity.email = 'mfa@example.com';
      entity.passwordHash = 'hashed_password';
      entity.role_key = Role.USER_PREMIUM;
      entity.firstName = 'Jane';
      entity.lastName = 'Smith';
      entity.phone = null;
      entity.status = UserStatus.ACTIVE;
      entity.failedLoginCount = 0;
      entity.emailVerified = true;
      entity.mfaEnabled = true;
      entity.mfaSecret = 'secret123';
      entity.createdAt = new Date('2024-01-01');

      const domain = mapper.toDomain(entity);

      expect(domain.isMfaEnabled()).toBe(true);
      expect(domain.getMfaSecret()).toBe('secret123');
    });
  });

  describe('toOrm', () => {
    it('should map AuthUser domain to EUser entity', () => {
      const domain = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: true,
        mfaEnabled: false,
        mfaSecret: undefined,
        createdAt: new Date('2024-01-01'),
      });

      const orm = mapper.toOrm(domain);

      expect(orm.email).toBe('test@example.com');
      expect(orm.passwordHash).toBe('hashed_password');
      expect(orm.role_key).toBe(Role.USER_FREEMIUM);
      expect(orm.firstName).toBe('John');
      expect(orm.lastName).toBe('Doe');
      expect(orm.phone).toBe('+1234567890');
      expect(orm.status).toBe(UserStatus.ACTIVE);
      expect(orm.failedLoginCount).toBe(0);
      expect(orm.emailVerified).toBe(true);
      expect(orm.mfaEnabled).toBe(false);
      expect(orm.mfaSecret).toBeUndefined();
    });

    it('should map AuthUser with MFA to ORM', () => {
      const domain = new AuthUser({
        id: 'user-456',
        email: 'mfa@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_PREMIUM,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: undefined,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: true,
        mfaEnabled: true,
        mfaSecret: 'secret123',
        createdAt: new Date('2024-01-01'),
      });

      const orm = mapper.toOrm(domain);

      expect(orm.mfaEnabled).toBe(true);
      expect(orm.mfaSecret).toBe('secret123');
      expect(orm.phone).toBeUndefined();
    });

    it('should not include id in ORM mapping', () => {
      const domain = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      const orm = mapper.toOrm(domain);

      expect(orm).not.toHaveProperty('id');
      expect(orm).not.toHaveProperty('createdAt');
    });
  });
});
