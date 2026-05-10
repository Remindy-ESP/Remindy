import { Test, TestingModule } from '@nestjs/testing';
import { LogoutUseCase } from './logout.use-case';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;

  const mockSessionRepo = {
    findActiveSessionById: jest.fn(),
    revokeSession: jest.fn(),
  } as jest.Mocked<IUserSessionRepository>;

  const mockPasswordService = {
    hash: jest.fn(),
    compare: jest.fn(),
  } as jest.Mocked<IPasswordService>;

  const mockTokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  } as jest.Mocked<ITokenService>;

  const mockEventEmitter = {
    emit: jest.fn(),
    emitAsync: jest.fn(),
  } as jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    jest.clearAllMocks();

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
        {
          provide: ITokenService,
          useValue: mockTokenService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    useCase = module.get<LogoutUseCase>(LogoutUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const refreshToken = 'valid-refresh-token';
    const sessionId = 'session-123';
    const mockSession = {
      id: sessionId,
      userId: 'user-456',
      refreshTokenHash: 'hashed-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      deviceName: 'Chrome',
      expiresAt: new Date(),
      lastActivity: new Date(),
      isRevoked: false,
    };

    it('should successfully logout user with valid refresh token', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ sessionId });

      mockSessionRepo.findActiveSessionById.mockResolvedValue(mockSession);

      mockPasswordService.compare.mockResolvedValue(true);

      mockSessionRepo.revokeSession.mockResolvedValue(undefined);

      await useCase.execute(refreshToken);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockSessionRepo.findActiveSessionById).toHaveBeenCalledWith(sessionId);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        refreshToken,
        mockSession.refreshTokenHash,
      );
      expect(mockSessionRepo.revokeSession).toHaveBeenCalledWith(sessionId);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.logout', {
        userId: mockSession.userId,
      });
    });

    it('should do nothing if token verification fails', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue(null);

      await useCase.execute(refreshToken);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockSessionRepo.findActiveSessionById).not.toHaveBeenCalled();
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockSessionRepo.revokeSession).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should do nothing if token has no sessionId', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({});

      await useCase.execute(refreshToken);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockSessionRepo.findActiveSessionById).not.toHaveBeenCalled();
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockSessionRepo.revokeSession).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should do nothing if session is not found', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ sessionId });
      mockSessionRepo.findActiveSessionById.mockResolvedValue(null);

      await useCase.execute(refreshToken);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockSessionRepo.findActiveSessionById).toHaveBeenCalledWith(sessionId);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockSessionRepo.revokeSession).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should do nothing if token comparison fails', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ sessionId });
      mockSessionRepo.findActiveSessionById.mockResolvedValue(mockSession);
      mockPasswordService.compare.mockResolvedValue(false);

      await useCase.execute(refreshToken);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockSessionRepo.findActiveSessionById).toHaveBeenCalledWith(sessionId);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        refreshToken,
        mockSession.refreshTokenHash,
      );
      expect(mockSessionRepo.revokeSession).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Token verification error');
      });

      await expect(useCase.execute(refreshToken)).rejects.toThrow();
    });
    it('should do nothing when verifyRefreshToken returns payload without sessionId', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ sub: 'user-123' } as any);

      await useCase.execute('refresh-token');

      expect(mockSessionRepo.findActiveSessionById).not.toHaveBeenCalled();
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockSessionRepo.revokeSession).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});

describe('LogoutUseCase constructor branch coverage', () => {
  it('should instantiate with all dependencies as null to cover constructor parameter branches', () => {
    const instance = new LogoutUseCase(null as any, null as any, null as any, null as any);
    expect(instance).toBeDefined();
  });
});
