import { Test, TestingModule } from '@nestjs/testing';
import { LogoutUseCase } from './logout.use-case';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let sessionRepo: jest.Mocked<IUserSessionRepository>;
  let passwordService: jest.Mocked<IPasswordService>;

  beforeEach(async () => {
    const mockSessionRepo: Partial<jest.Mocked<IUserSessionRepository>> = {
      findActiveByRefreshTokenHash: jest.fn(),
      revokeSession: jest.fn(),
    };

    const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
      hash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        {
          provide: IUserSessionRepository,
          useValue: mockSessionRepo,
        },
        {
          provide: IPasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    useCase = module.get<LogoutUseCase>(LogoutUseCase);
    sessionRepo = module.get(IUserSessionRepository);
    passwordService = module.get(IPasswordService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const refreshToken = 'refreshToken123';
    const hashedToken = 'hashedRefreshToken123';
    const mockSession = {
      id: 'session-123',
      userId: 'user-456',
      refreshTokenHash: hashedToken,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      deviceName: 'Chrome',
      expiresAt: new Date(Date.now() + 86400000),
      lastActivity: new Date(),
      isRevoked: false,
    };

    it('should successfully logout user with valid refresh token', async () => {
      passwordService.hash.mockResolvedValue(hashedToken);
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(mockSession);
      sessionRepo.revokeSession.mockResolvedValue(undefined);

      await useCase.execute(refreshToken);

      expect(passwordService.hash).toHaveBeenCalledWith(refreshToken);
      expect(sessionRepo.findActiveByRefreshTokenHash).toHaveBeenCalledWith(hashedToken);
      expect(sessionRepo.revokeSession).toHaveBeenCalledWith('session-123');
    });

    it('should not throw error when session is not found', async () => {
      passwordService.hash.mockResolvedValue(hashedToken);
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(null);

      await expect(useCase.execute(refreshToken)).resolves.not.toThrow();
      expect(sessionRepo.revokeSession).not.toHaveBeenCalled();
    });

    it('should return silently when session does not exist', async () => {
      passwordService.hash.mockResolvedValue('hashedToken');
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(null);

      const result = await useCase.execute(refreshToken);

      expect(result).toBeUndefined();
      expect(sessionRepo.revokeSession).not.toHaveBeenCalled();
    });

    it('should hash refresh token before querying', async () => {
      const plainToken = 'myPlainRefreshToken';
      const expectedHash = 'expectedHashedToken';

      passwordService.hash.mockResolvedValue(expectedHash);
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(mockSession);
      sessionRepo.revokeSession.mockResolvedValue(undefined);

      await useCase.execute(plainToken);

      expect(passwordService.hash).toHaveBeenCalledWith(plainToken);
      expect(sessionRepo.findActiveByRefreshTokenHash).toHaveBeenCalledWith(expectedHash);
    });

    it('should call revokeSession with correct session id', async () => {
      const sessionId = 'unique-session-id';
      const sessionWithId = { ...mockSession, id: sessionId };

      passwordService.hash.mockResolvedValue(hashedToken);
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(sessionWithId);
      sessionRepo.revokeSession.mockResolvedValue(undefined);

      await useCase.execute(refreshToken);

      expect(sessionRepo.revokeSession).toHaveBeenCalledWith(sessionId);
      expect(sessionRepo.revokeSession).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple logout calls gracefully', async () => {
      passwordService.hash.mockResolvedValue(hashedToken);
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(mockSession);
      sessionRepo.revokeSession.mockResolvedValue(undefined);

      await useCase.execute(refreshToken);

      // Second call - session already revoked
      sessionRepo.findActiveByRefreshTokenHash.mockResolvedValue(null);
      await useCase.execute(refreshToken);

      expect(sessionRepo.revokeSession).toHaveBeenCalledTimes(1);
    });
  });
});
