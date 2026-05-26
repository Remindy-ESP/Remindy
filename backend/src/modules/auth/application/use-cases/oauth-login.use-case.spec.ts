import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OAuthLoginUseCase } from './oauth-login.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoogleOAuthService } from '../../infrastructure/services/google-oauth.service';
import { MicrosoftOAuthService } from '../../infrastructure/services/microsoft-oauth.service';
import { AppleOAuthService } from '../../infrastructure/services/apple-oauth.service';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

const makeUser = (overrides: Partial<Record<string, any>> = {}) => ({
  getId: jest.fn().mockReturnValue('user-123'),
  getEmail: jest.fn().mockReturnValue('test@example.com'),
  getPasswordHash: jest.fn().mockReturnValue(null),
  getRoleKey: jest.fn().mockReturnValue(Role.USER_FREEMIUM),
  isMfaEnabled: jest.fn().mockReturnValue(false),
  getStatus: jest.fn().mockReturnValue(UserStatus.ACTIVE),
  getGoogleId: jest.fn().mockReturnValue(null),
  getMicrosoftId: jest.fn().mockReturnValue(null),
  getAppleId: jest.fn().mockReturnValue(null),
  ...overrides,
});

const googleInfo = {
  providerId: 'google-sub-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

const microsoftInfo = {
  providerId: 'ms-id-456',
  email: 'test@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
};

const appleInfo = {
  providerId: 'apple-sub-789',
  email: null,
};

describe('OAuthLoginUseCase', () => {
  let useCase: OAuthLoginUseCase;
  let userRepo: jest.Mocked<any>;
  let sessionRepo: jest.Mocked<any>;
  let passwordService: jest.Mocked<any>;
  let tokenService: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<any>;
  let googleService: jest.Mocked<any>;
  let microsoftService: jest.Mocked<any>;
  let appleService: jest.Mocked<any>;

  const baseParams = {
    ipAddress: '127.0.0.1',
    userAgent: 'TestAgent/1.0',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthLoginUseCase,
        {
          provide: IUserAuthRepository,
          useValue: {
            findByOAuthId: jest.fn(),
            findByEmail: jest.fn(),
            linkOAuthId: jest.fn(),
            save: jest.fn(),
            updateLastLoginAt: jest.fn(),
          },
        },
        {
          provide: IUserSessionRepository,
          useValue: {
            createSession: jest.fn(),
          },
        },
        {
          provide: IPasswordService,
          useValue: {
            hash: jest.fn().mockResolvedValue('hashed-refresh-token'),
          },
        },
        {
          provide: ITokenService,
          useValue: {
            generateAccessToken: jest.fn().mockReturnValue('access-token'),
            generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: GoogleOAuthService,
          useValue: {
            verifyIdToken: jest.fn(),
          },
        },
        {
          provide: MicrosoftOAuthService,
          useValue: {
            verifyAccessToken: jest.fn(),
          },
        },
        {
          provide: AppleOAuthService,
          useValue: {
            verifyIdentityToken: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(OAuthLoginUseCase);
    userRepo = module.get(IUserAuthRepository);
    sessionRepo = module.get(IUserSessionRepository);
    passwordService = module.get(IPasswordService);
    tokenService = module.get(ITokenService);
    eventEmitter = module.get(EventEmitter2);
    googleService = module.get(GoogleOAuthService);
    microsoftService = module.get(MicrosoftOAuthService);
    appleService = module.get(AppleOAuthService);
  });

  describe('Google provider', () => {
    it('returns tokens when user already exists by providerId', async () => {
      const existingUser = makeUser();
      googleService.verifyIdToken.mockResolvedValue(googleInfo);
      userRepo.findByOAuthId.mockResolvedValue(existingUser);
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...baseParams,
        provider: 'google',
        token: 'google-id-token',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.userId).toBe('user-123');
      expect(userRepo.findByOAuthId).toHaveBeenCalledWith('google', 'google-sub-123');
      expect(userRepo.findByEmail).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('links provider and returns tokens when user exists by email but not by providerId', async () => {
      const existingUser = makeUser();
      googleService.verifyIdToken.mockResolvedValue(googleInfo);
      userRepo.findByOAuthId.mockResolvedValue(null);
      userRepo.findByEmail.mockResolvedValue(existingUser);
      userRepo.linkOAuthId.mockResolvedValue(undefined);
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...baseParams,
        provider: 'google',
        token: 'google-id-token',
      });

      expect(userRepo.linkOAuthId).toHaveBeenCalledWith('user-123', 'google', 'google-sub-123');
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
    });

    it('creates a new user when no existing account found', async () => {
      const newUser = makeUser();
      googleService.verifyIdToken.mockResolvedValue(googleInfo);
      userRepo.findByOAuthId.mockResolvedValue(null);
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(newUser);
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...baseParams,
        provider: 'google',
        token: 'google-id-token',
      });

      expect(userRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'auth.oauth.user.created',
        expect.objectContaining({ provider: 'google' }),
      );
      expect(result.userId).toBe('user-123');
    });

    it('throws UnauthorizedException when account is BANNED', async () => {
      const bannedUser = makeUser({ getStatus: jest.fn().mockReturnValue(UserStatus.BANNED) });
      googleService.verifyIdToken.mockResolvedValue(googleInfo);
      userRepo.findByOAuthId.mockResolvedValue(bannedUser);

      await expect(
        useCase.execute({ ...baseParams, provider: 'google', token: 'google-id-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Microsoft provider', () => {
    it('returns tokens for an existing Microsoft user', async () => {
      const existingUser = makeUser();
      microsoftService.verifyAccessToken.mockResolvedValue(microsoftInfo);
      userRepo.findByOAuthId.mockResolvedValue(existingUser);
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...baseParams,
        provider: 'microsoft',
        token: 'ms-access-token',
      });

      expect(microsoftService.verifyAccessToken).toHaveBeenCalledWith('ms-access-token');
      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('Apple provider', () => {
    it('throws UnauthorizedException when Apple email is missing and no existing user', async () => {
      appleService.verifyIdentityToken.mockResolvedValue(appleInfo);
      userRepo.findByOAuthId.mockResolvedValue(null);
      // No email provided and token email is null
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        useCase.execute({
          ...baseParams,
          provider: 'apple',
          token: 'apple-identity-token',
        }),
      ).rejects.toThrow('Email required for account creation');
    });

    it('creates new Apple user when email is provided in params', async () => {
      const newUser = makeUser();
      appleService.verifyIdentityToken.mockResolvedValue(appleInfo);
      userRepo.findByOAuthId.mockResolvedValue(null);
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(newUser);
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...baseParams,
        provider: 'apple',
        token: 'apple-identity-token',
        appleEmail: 'apple@icloud.com',
        appleFirstName: 'Tim',
        appleLastName: 'Apple',
      });

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.userId).toBe('user-123');
    });

    it('emits security.login.success event', async () => {
      const existingUser = makeUser();
      appleService.verifyIdentityToken.mockResolvedValue({
        providerId: 'apple-sub-789',
        email: 'known@apple.com',
      });
      userRepo.findByOAuthId.mockResolvedValue(existingUser);
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      await useCase.execute({
        ...baseParams,
        provider: 'apple',
        token: 'apple-identity-token',
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'security.login.success',
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
    });
  });
});
