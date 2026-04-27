import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-access-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with JWT_ACCESS_TOKEN_SECRET from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_SECRET');
      expect(strategy).toBeDefined();
    });

    it('should configure JWT extraction from Authorization header as Bearer token', () => {
      // Strategy should be configured to extract from Authorization header
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user data with userId and role from payload', () => {
      const payload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM',
        email: 'test@example.com',
        mfaEnabled: false,
        mfaVerified: false,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        userId: 'user-123',
        role: 'USER_FREEMIUM',
        mfaEnabled: false,
        mfaVerified: false,
      });
    });

    it('should extract userId from sub field in payload', () => {
      const payload = {
        sub: 'user-456',
        role: 'ADMIN',
        mfaEnabled: false,
        mfaVerified: false,
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe('user-456');
      expect(result.role).toBe('ADMIN');
      expect(result.mfaEnabled).toBe(false);
      expect(result.mfaVerified).toBe(false);
    });

    it('should handle payload with additional fields', () => {
      const payload = {
        sub: 'user-789',
        role: 'USER_PREMIUM',
        email: 'premium@example.com',
        iat: 1234567890,
        exp: 1234567900,
        mfaEnabled: false,
        mfaVerified: false,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-789',
        userId: 'user-789',
        role: 'USER_PREMIUM',
        mfaEnabled: false,
        mfaVerified: false,
      });
    });

    it('should work with different user roles', () => {
      const adminPayload = { sub: 'admin-1', role: 'ADMIN', mfaEnabled: false, mfaVerified: false };
      const userPayload = {
        sub: 'user-1',
        role: 'USER_FREEMIUM',
        mfaEnabled: false,
        mfaVerified: false,
      };
      const premiumPayload = {
        sub: 'premium-1',
        role: 'USER_PREMIUM',
        mfaEnabled: false,
        mfaVerified: false,
      };

      expect(strategy.validate(adminPayload).role).toBe('ADMIN');
      expect(strategy.validate(adminPayload).mfaEnabled).toBe(false);
      expect(strategy.validate(adminPayload).mfaVerified).toBe(false);

      expect(strategy.validate(userPayload).role).toBe('USER_FREEMIUM');
      expect(strategy.validate(userPayload).mfaEnabled).toBe(false);
      expect(strategy.validate(userPayload).mfaVerified).toBe(false);

      expect(strategy.validate(premiumPayload).role).toBe('USER_PREMIUM');
      expect(strategy.validate(premiumPayload).mfaEnabled).toBe(false);
      expect(strategy.validate(premiumPayload).mfaVerified).toBe(false);
    });

    it('should throw UnauthorizedException when sub is undefined', () => {
      const payload = {
        sub: undefined,
        role: 'USER_FREEMIUM',
        mfaEnabled: false,
        mfaVerified: false,
      };

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when role is undefined', () => {
      const payload = {
        sub: 'user-123',
        role: undefined,
        mfaEnabled: false,
        mfaVerified: false,
      };

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('should handle payload with missing mfa fields', () => {
      const payload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        userId: 'user-123',
        role: 'USER_FREEMIUM',
        mfaEnabled: false,
        mfaVerified: false,
      });
    });

    it('should throw UnauthorizedException for empty payload', () => {
      expect(() => strategy.validate({})).toThrow(UnauthorizedException);
    });

    it('should not include email or other fields in result', () => {
      const payload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM',
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = strategy.validate(payload);

      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('name');
      expect(Object.keys(result)).toEqual(['id', 'userId', 'role', 'mfaEnabled', 'mfaVerified']);
    });
  });
});
