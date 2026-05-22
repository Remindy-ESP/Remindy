import { AuthUser } from './auth-user.entity';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from '../value-objects/role.enum';

describe('AuthUser Entity', () => {
  describe('constructor', () => {
    it('should create an AuthUser with all properties', () => {
      const createdAt = new Date();
      const user = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        failedLoginCount: 0,
        emailVerified: true,
        mfaEnabled: false,
        mfaSecret: undefined,
        createdAt,
      });

      expect(user.getId()).toBe('user-123');
      expect(user.getEmail()).toBe('test@example.com');
      expect(user.getPasswordHash()).toBe('hashed_password');
      expect(user.getRoleKey()).toBe(Role.USER_FREEMIUM);
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.getFirstName()).toBe('John');
      expect(user.getLastName()).toBe('Doe');
      expect(user.getPhone()).toBe('+1234567890');
      expect(user.getFailedLoginCount()).toBe(0);
      expect(user.isEmailVerified()).toBe(true);
      expect(user.isMfaEnabled()).toBe(false);
      expect(user.getMfaSecret()).toBeUndefined();
      expect(user.getCreatedAt()).toBe(createdAt);
    });

    it('should create an AuthUser without optional properties', () => {
      const user = new AuthUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      expect(user.getEmail()).toBe('test@example.com');
      expect(user.getPhone()).toBeUndefined();
      expect(user.getMfaSecret()).toBeUndefined();
      expect(user.getCreatedAt()).toBeUndefined();
    });
  });

  describe('createNew factory', () => {
    it('should create a new user with default role USER_FREEMIUM', () => {
      const user = AuthUser.createNew({
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(user.getEmail()).toBe('new@example.com');
      expect(user.getPasswordHash()).toBe('hashed_password');
      expect(user.getFirstName()).toBe('Jane');
      expect(user.getLastName()).toBe('Smith');
      expect(user.getRoleKey()).toBe(Role.USER_FREEMIUM);
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.getFailedLoginCount()).toBe(0);
      expect(user.isEmailVerified()).toBe(false);
      expect(user.isMfaEnabled()).toBe(false);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create a new user with specified role', () => {
      const user = AuthUser.createNew({
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Admin',
        lastName: 'User',
        role_key: Role.USER_ADMIN,
      });

      expect(user.getRoleKey()).toBe(Role.USER_ADMIN);
    });

    it('should create a new user with phone number', () => {
      const user = AuthUser.createNew({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      });

      expect(user.getPhone()).toBe('+1234567890');
    });

    it('should create a new user without phone number', () => {
      const user = AuthUser.createNew({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.getPhone()).toBeUndefined();
    });
  });

  describe('getId', () => {
    it('should return the user ID when defined', () => {
      const user = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      expect(user.getId()).toBe('user-123');
    });

    it('should throw error when ID is not defined', () => {
      const user = new AuthUser({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      expect(() => user.getId()).toThrow('AuthUser ID is not defined');
    });
  });

  describe('getters', () => {
    let user: AuthUser;

    beforeEach(() => {
      user = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_PREMIUM,
        status: UserStatus.BANNED,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        failedLoginCount: 3,
        emailVerified: true,
        mfaEnabled: true,
        mfaSecret: 'secret123',
        createdAt: new Date('2024-01-01'),
      });
    });

    it('should get email', () => {
      expect(user.getEmail()).toBe('test@example.com');
    });

    it('should get password hash', () => {
      expect(user.getPasswordHash()).toBe('hashed_password');
    });

    it('should get first name', () => {
      expect(user.getFirstName()).toBe('John');
    });

    it('should get last name', () => {
      expect(user.getLastName()).toBe('Doe');
    });

    it('should get phone', () => {
      expect(user.getPhone()).toBe('+1234567890');
    });

    it('should get role key', () => {
      expect(user.getRoleKey()).toBe(Role.USER_PREMIUM);
    });

    it('should get status', () => {
      expect(user.getStatus()).toBe(UserStatus.BANNED);
    });

    it('should get failed login count', () => {
      expect(user.getFailedLoginCount()).toBe(3);
    });

    it('should check if email is verified', () => {
      expect(user.isEmailVerified()).toBe(true);
    });

    it('should check if MFA is enabled', () => {
      expect(user.isMfaEnabled()).toBe(true);
    });

    it('should get MFA secret', () => {
      expect(user.getMfaSecret()).toBe('secret123');
    });

    it('should get created at date', () => {
      expect(user.getCreatedAt()).toEqual(new Date('2024-01-01'));
    });
  });
});
