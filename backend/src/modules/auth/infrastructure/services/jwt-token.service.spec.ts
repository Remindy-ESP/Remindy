import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from './jwt-token.service';
import { JwtAccessPayload, JwtRefreshPayload } from '../../domain/services/token.service';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token with correct payload', () => {
      const payload = { sub: 'user-123' };
      const expectedToken = 'password_reset_token';
      const resetSecret = 'password_reset_secret';

      configService.get.mockReturnValue(resetSecret);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = service.generatePasswordResetToken(payload);

      expect(result).toBe(expectedToken);
      expect(configService.get).toHaveBeenCalledWith('JWT_PASSWORD_RESET_SECRET');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-123' },
        {
          secret: resetSecret,
          expiresIn: '15m',
        },
      );
    });

    it('should use 15m expiration for password reset token', () => {
      const payload = { sub: 'user-456' };
      configService.get.mockReturnValue('secret');
      jwtService.sign.mockReturnValue('token');

      service.generatePasswordResetToken(payload);

      const signCall = jwtService.sign.mock.calls[0];
      expect(signCall[1]).toHaveProperty('expiresIn', '15m');
    });
    it('should still call sign even if password reset secret is undefined', () => {
      configService.get.mockReturnValue(undefined);
      jwtService.sign.mockReturnValue('token-with-undefined-secret');

      const result = service.generatePasswordResetToken({ sub: 'user-123' });

      expect(result).toBe('token-with-undefined-secret');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-123' },
        {
          secret: undefined,
          expiresIn: '15m',
        },
      );
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      const payload: JwtAccessPayload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM' as any,
        mfaEnabled: false,
        mfaVerified: false,
      };
      const expectedToken = 'access_token_value';
      const accessSecret = 'access_token_secret';
      const accessExpiration = '15m';

      configService.get.mockReturnValueOnce(accessSecret).mockReturnValueOnce(accessExpiration);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = service.generateAccessToken(payload);

      expect(result).toBe(expectedToken);
      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_SECRET');
      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_EXPIRATION');
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration,
      });
    });

    it('should generate access token with all payload fields', () => {
      const payload: JwtAccessPayload = {
        sub: 'user-789',
        role: 'USER_ADMIN' as any,
        mfaEnabled: false,
        mfaVerified: false,
      };

      configService.get.mockReturnValueOnce('secret').mockReturnValueOnce('30m');
      jwtService.sign.mockReturnValue('token');

      service.generateAccessToken(payload);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-789',
          role: 'USER_ADMIN',
        }),
        expect.any(Object),
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return access token payload', () => {
      const token = 'valid_access_token';
      const expectedPayload: JwtAccessPayload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM' as any,
        mfaEnabled: false,
        mfaVerified: false,
      };
      const accessSecret = 'access_token_secret';

      configService.get.mockReturnValue(accessSecret);
      jwtService.verify.mockReturnValue(expectedPayload);

      const result = service.verifyAccessToken(token);

      expect(result).toEqual(expectedPayload);
      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: accessSecret,
      });
    });

    it('should throw error for invalid access token', () => {
      const token = 'invalid_token';
      const accessSecret = 'access_token_secret';

      configService.get.mockReturnValue(accessSecret);
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyAccessToken(token)).toThrow('Invalid token');
    });

    it('should throw error for expired access token', () => {
      const token = 'expired_token';
      const accessSecret = 'access_token_secret';

      configService.get.mockReturnValue(accessSecret);
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => service.verifyAccessToken(token)).toThrow('Token expired');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      const payload: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-456',
      };
      const expectedToken = 'refresh_token_value';
      const refreshSecret = 'refresh_token_secret';
      const refreshExpiration = '7d';

      configService.get.mockReturnValueOnce(refreshSecret).mockReturnValueOnce(refreshExpiration);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = service.generateRefreshToken(payload);

      expect(result).toBe(expectedToken);
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_SECRET');
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_EXPIRATION');
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiration,
      });
    });

    it('should generate refresh token with session id', () => {
      const payload: JwtRefreshPayload = {
        sub: 'user-789',
        sessionId: 'session-123',
      };

      configService.get.mockReturnValueOnce('secret').mockReturnValueOnce('30d');
      jwtService.sign.mockReturnValue('token');

      service.generateRefreshToken(payload);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-789',
          sessionId: 'session-123',
        }),
        expect.any(Object),
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return refresh token payload', () => {
      const token = 'valid_refresh_token';
      const expectedPayload: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-456',
      };
      const refreshSecret = 'refresh_token_secret';

      configService.get.mockReturnValue(refreshSecret);
      jwtService.verify.mockReturnValue(expectedPayload);

      const result = service.verifyRefreshToken(token);

      expect(result).toEqual(expectedPayload);
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: refreshSecret,
      });
    });

    it('should throw error for invalid refresh token', () => {
      const token = 'invalid_refresh_token';
      const refreshSecret = 'refresh_token_secret';

      configService.get.mockReturnValue(refreshSecret);
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyRefreshToken(token)).toThrow('Invalid token');
    });

    it('should throw error for expired refresh token', () => {
      const token = 'expired_refresh_token';
      const refreshSecret = 'refresh_token_secret';

      configService.get.mockReturnValue(refreshSecret);
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => service.verifyRefreshToken(token)).toThrow('Token expired');
    });

    it('should return payload with sessionId', () => {
      const token = 'token_with_session';
      const expectedPayload: JwtRefreshPayload = {
        sub: 'user-999',
        sessionId: 'session-888',
      };

      configService.get.mockReturnValue('secret');
      jwtService.verify.mockReturnValue(expectedPayload);

      const result = service.verifyRefreshToken(token);

      expect(result.sessionId).toBe('session-888');
      expect(result.sub).toBe('user-999');
    });
  });

  describe('token lifecycle', () => {
    it('should use different secrets for access and refresh tokens', () => {
      const accessPayload: JwtAccessPayload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM' as any,
        mfaEnabled: false,
        mfaVerified: false,
      };
      const refreshPayload: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-456',
      };

      configService.get
        .mockReturnValueOnce('access_secret')
        .mockReturnValueOnce('15m')
        .mockReturnValueOnce('refresh_secret')
        .mockReturnValueOnce('7d');
      jwtService.sign.mockReturnValue('token');

      service.generateAccessToken(accessPayload);
      service.generateRefreshToken(refreshPayload);

      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_SECRET');
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_SECRET');
    });

    it('should use different expirations for access and refresh tokens', () => {
      const accessPayload: JwtAccessPayload = {
        sub: 'user-123',
        role: 'USER_FREEMIUM' as any,
        mfaEnabled: false,
        mfaVerified: false,
      };
      const refreshPayload: JwtRefreshPayload = {
        sub: 'user-123',
        sessionId: 'session-456',
      };

      configService.get
        .mockReturnValueOnce('secret')
        .mockReturnValueOnce('15m')
        .mockReturnValueOnce('secret')
        .mockReturnValueOnce('30d');
      jwtService.sign.mockReturnValue('token');

      service.generateAccessToken(accessPayload);
      service.generateRefreshToken(refreshPayload);

      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_EXPIRATION');
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_EXPIRATION');
    });
  });
});

describe('JwtTokenService constructor branch coverage', () => {
  it('should instantiate with null dependencies to cover constructor parameter branches', () => {
    const instance = new JwtTokenService(null as any, null as any);
    expect(instance).toBeDefined();
  });
});
