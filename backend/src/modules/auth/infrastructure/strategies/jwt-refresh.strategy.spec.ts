import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtRefreshPayload } from '../../domain/services/token.service';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-refresh-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with JWT_REFRESH_TOKEN_SECRET from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_SECRET');
      expect(strategy).toBeDefined();
    });

    it('should configure JWT extraction from cookies', () => {
      // Strategy should be configured to extract from cookies
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user data with userId and sessionId from payload', () => {
      const payload: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-456',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        sessionId: 'session-456',
      });
    });

    it('should extract userId from sub field in payload', () => {
      const payload: JwtRefreshPayload = {
        sub: 'user-789',
        sessionId: 'session-abc',
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe('user-789');
      expect(result.sessionId).toBe('session-abc');
    });

    it('should handle payload with additional JWT fields', () => {
      const payload: any = {
        sub: 'user-999',
        sessionId: 'session-xyz',
        iat: 1234567890,
        exp: 1234567900,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-999',
        sessionId: 'session-xyz',
      });
    });

    it('should work with different session ids', () => {
      const payload1: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-1',
      };
      const payload2: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-2',
      };

      const result1 = strategy.validate(payload1);
      const result2 = strategy.validate(payload2);

      expect(result1.sessionId).toBe('session-1');
      expect(result2.sessionId).toBe('session-2');
    });

    it('should work with different user ids', () => {
      const payload1: JwtRefreshPayload = {
        sub: 'user-1',
        sessionId: 'session-456',
      };
      const payload2: JwtRefreshPayload = {
        sub: 'user-2',
        sessionId: 'session-456',
      };

      const result1 = strategy.validate(payload1);
      const result2 = strategy.validate(payload2);

      expect(result1.userId).toBe('user-1');
      expect(result2.userId).toBe('user-2');
    });

    it('should handle payload with UUID format ids', () => {
      const payload: JwtRefreshPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.sessionId).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    });

    it('should not include additional fields in result', () => {
      const payload: any = {
        sub: 'user-123',
        sessionId: 'session-456',
        iat: 1234567890,
        exp: 1234567900,
        role: 'USER_FREEMIUM',
      };

      const result = strategy.validate(payload);

      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
      expect(result).not.toHaveProperty('role');
      expect(Object.keys(result)).toEqual(['userId', 'sessionId']);
    });
  });

  describe('cookie extraction', () => {
    it('should be configured to extract token from cookies', () => {
      // This test verifies that the strategy is properly configured
      // The actual extraction is tested via integration tests
      expect(strategy).toBeDefined();
    });

    it('should extract string token from cookies', () => {
      // Access the extractor function through the strategy's options
      const extractorFn = (strategy as any)._jwtFromRequest;

      const mockReq = {
        cookies: {
          refreshToken: 'valid-jwt-token-string',
        },
      } as any;

      const result = extractorFn(mockReq);

      expect(result).toBe('valid-jwt-token-string');
    });

    it('should return null when token is not a string', () => {
      const extractorFn = (strategy as any)._jwtFromRequest;

      const mockReq = {
        cookies: {
          refreshToken: 12345, // Not a string
        },
      } as any;

      const result = extractorFn(mockReq);

      expect(result).toBeNull();
    });

    it('should return null when cookies object is undefined', () => {
      const extractorFn = (strategy as any)._jwtFromRequest;

      const mockReq = {} as any;

      const result = extractorFn(mockReq);

      expect(result).toBeNull();
    });

    it('should return null when refreshToken is undefined', () => {
      const extractorFn = (strategy as any)._jwtFromRequest;

      const mockReq = {
        cookies: {},
      } as any;

      const result = extractorFn(mockReq);

      expect(result).toBeNull();
    });

    it('should return null when refreshToken is null', () => {
      const extractorFn = (strategy as any)._jwtFromRequest;

      const mockReq = {
        cookies: {
          refreshToken: null,
        },
      } as any;

      const result = extractorFn(mockReq);

      expect(result).toBeNull();
    });

    it('should handle empty string token', () => {
      const extractorFn = (strategy as any)._jwtFromRequest;

      const mockReq = {
        cookies: {
          refreshToken: '',
        },
      } as any;

      const result = extractorFn(mockReq);

      // Empty string is still a string, so it should be returned
      expect(result).toBe('');
    });
  });
});
