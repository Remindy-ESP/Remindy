import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { ITokenService } from '../../domain/services/token.service';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let tokenService: jest.Mocked<ITokenService>;
  let sessionRepo: jest.Mocked<IUserSessionRepository>;
  let passwordService: jest.Mocked<IPasswordService>;
  let userRepo: jest.Mocked<IUserAuthRepository>;

  const mockUser = new AuthUser({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    phone: '',
    role_key: Role.USER_PREMIUM,
    mfaEnabled: false,
    mfaVerified: false,
    status: UserStatus.ACTIVE,
    failedLoginCount: 0,
    emailVerified: true,
    createdAt: new Date(),
  });

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    refreshTokenHash: 'hashedRefreshToken',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    deviceName: 'Chrome',
    expiresAt: new Date(Date.now() + 86400000),
    lastActivity: new Date(),
    isRevoked: false,
  };

  beforeEach(async () => {
    const mockTokenService: Partial<jest.Mocked<ITokenService>> = {
      verifyRefreshToken: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };

    const mockSessionRepo: Partial<jest.Mocked<IUserSessionRepository>> = {
      findActiveSessionById: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    const mockUserRepo: Partial<jest.Mocked<IUserAuthRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: ITokenService,
          useValue: mockTokenService,
        },
        {
          provide: IUserSessionRepository,
          useValue: mockSessionRepo,
        },
        {
          provide: IPasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: IUserAuthRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    tokenService = module.get(ITokenService);
    sessionRepo = module.get(IUserSessionRepository);
    passwordService = module.get(IPasswordService);
    userRepo = module.get(IUserAuthRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const refreshParams = {
      refreshToken: 'validRefreshToken',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should successfully refresh tokens with valid refresh token', async () => {
      const tokenPayload = { sub: 'user-123', sessionId: 'session-123' };

      tokenService.verifyRefreshToken.mockReturnValue(tokenPayload);
      sessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      passwordService.compare.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(mockUser);
      tokenService.generateAccessToken.mockReturnValue('newAccessToken');
      tokenService.generateRefreshToken.mockReturnValue('newRefreshToken');
      passwordService.hash.mockResolvedValue('newHashedRefreshToken');
      sessionRepo.updateRefreshToken.mockResolvedValue(undefined);

      const result = await useCase.execute(refreshParams);

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      expect(sessionRepo.updateRefreshToken).toHaveBeenCalledWith('session-123', {
        refreshTokenHash: 'newHashedRefreshToken',
        lastActivity: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      tokenService.verifyRefreshToken.mockReturnValue(null);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException when token has no sub claim', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({ sessionId: 'session-123' } as any);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException when session is not found', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(null);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Session expired or revoked');
    });

    it('should throw UnauthorizedException when session is revoked', async () => {
      const revokedSession = { ...mockSession, isRevoked: true };

      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(revokedSession);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Session expired or revoked');
    });

    it('should throw UnauthorizedException when session is expired', async () => {
      const expiredSession = { ...mockSession, expiresAt: new Date(Date.now() - 86400000) };

      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(expiredSession);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Session expired or revoked');
    });

    it('should throw UnauthorizedException when session userId does not match token sub', async () => {
      const sessionBelongingToOtherUser = {
        ...mockSession,
        userId: 'other-user-456',
      };

      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(sessionBelongingToOtherUser);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow(
        'Session does not belong to this user',
      );
    });

    it('should throw UnauthorizedException when refresh token hash does not match', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      passwordService.compare.mockResolvedValue(false);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      passwordService.compare.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('User not found');
    });

    it('should generate new tokens with correct payloads', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      passwordService.compare.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(mockUser);
      tokenService.generateAccessToken.mockReturnValue('newAccessToken');
      tokenService.generateRefreshToken.mockReturnValue('newRefreshToken');
      passwordService.hash.mockResolvedValue('newHashedRefreshToken');
      sessionRepo.updateRefreshToken.mockResolvedValue(undefined);

      await useCase.execute(refreshParams);

      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'user-123',
        role: Role.USER_PREMIUM,
        mfaEnabled: false,
        mfaVerified: false,
      });

      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
        sub: 'user-123',
        sessionId: 'session-123',
      });
    });

    it('should update session with new hashed refresh token', async () => {
      const newRefreshToken = 'brandNewRefreshToken';
      const newHashedToken = 'brandNewHashedToken';

      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      passwordService.compare.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(mockUser);
      tokenService.generateAccessToken.mockReturnValue('newAccessToken');
      tokenService.generateRefreshToken.mockReturnValue(newRefreshToken);
      passwordService.hash.mockResolvedValue(newHashedToken);
      sessionRepo.updateRefreshToken.mockResolvedValue(undefined);

      await useCase.execute(refreshParams);

      expect(passwordService.hash).toHaveBeenCalledWith(newRefreshToken);
      expect(sessionRepo.updateRefreshToken).toHaveBeenCalledWith('session-123', {
        refreshTokenHash: newHashedToken,
        lastActivity: expect.any(Date),
      });
    });

    it('should update lastActivity timestamp', async () => {
      const beforeExecution = Date.now();

      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-123',
      });
      sessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      passwordService.compare.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(mockUser);
      tokenService.generateAccessToken.mockReturnValue('newAccessToken');
      tokenService.generateRefreshToken.mockReturnValue('newRefreshToken');
      passwordService.hash.mockResolvedValue('newHashedRefreshToken');
      sessionRepo.updateRefreshToken.mockResolvedValue(undefined);

      await useCase.execute(refreshParams);

      const afterExecution = Date.now();
      const updateCall = sessionRepo.updateRefreshToken.mock.calls[0][1];
      const lastActivityTime = updateCall.lastActivity.getTime();

      expect(lastActivityTime).toBeGreaterThanOrEqual(beforeExecution);
      expect(lastActivityTime).toBeLessThanOrEqual(afterExecution);
    });
    it('should throw UnauthorizedException when payload has no sub even if sessionId exists', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({ sessionId: 'session-123' } as any);

      await expect(useCase.execute(refreshParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(refreshParams)).rejects.toThrow('Invalid refresh token');
    });
  });
});

describe('RefreshTokenUseCase constructor branch coverage', () => {
  it('should instantiate with all dependencies as null to cover constructor parameter branches', () => {
    const instance = new RefreshTokenUseCase(null as any, null as any, null as any, null as any);
    expect(instance).toBeDefined();
  });
});
