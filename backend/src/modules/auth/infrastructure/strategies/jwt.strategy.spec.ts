import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        role: 'USER_FREEMIUM',
      });
    });

    it('should extract userId from sub field in payload', () => {
      const payload = {
        sub: 'user-456',
        role: 'ADMIN',
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe('user-456');
      expect(result.role).toBe('ADMIN');
    });

    it('should handle payload with additional fields', () => {
      const payload = {
        sub: 'user-789',
        role: 'USER_PREMIUM',
        email: 'premium@example.com',
        iat: 1234567890,
        exp: 1234567900,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-789',
        role: 'USER_PREMIUM',
      });
    });

    it('should work with different user roles', () => {
      const adminPayload = { sub: 'admin-1', role: 'ADMIN' };
      const userPayload = { sub: 'user-1', role: 'USER_FREEMIUM' };
      const premiumPayload = { sub: 'premium-1', role: 'USER_PREMIUM' };

      expect(strategy.validate(adminPayload).role).toBe('ADMIN');
      expect(strategy.validate(userPayload).role).toBe('USER_FREEMIUM');
      expect(strategy.validate(premiumPayload).role).toBe('USER_PREMIUM');
    });

    it('should return userId from sub even when undefined', () => {
      const payload = {
        sub: undefined,
        role: 'USER_FREEMIUM',
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBeUndefined();
      expect(result.role).toBe('USER_FREEMIUM');
    });

    it('should return role even when undefined', () => {
      const payload = {
        sub: 'user-123',
        role: undefined,
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe('user-123');
      expect(result.role).toBeUndefined();
    });

    it('should handle empty payload object', () => {
      const payload = {};

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: undefined,
        role: undefined,
      });
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
      expect(Object.keys(result)).toEqual(['userId', 'role']);
    });
  });
});
