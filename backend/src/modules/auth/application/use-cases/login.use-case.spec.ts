import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: jest.Mocked<IUserAuthRepository>;
  let sessionRepo: jest.Mocked<IUserSessionRepository>;
  let passwordService: jest.Mocked<IPasswordService>;
  let tokenService: jest.Mocked<ITokenService>;

  const mockUser = new AuthUser({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    mfaEnabled: false,
    mfaVerified: false,
    role_key: Role.USER_FREEMIUM,
    status: UserStatus.ACTIVE,
    failedLoginCount: 0,
    emailVerified: true,
    createdAt: new Date(),
  });

  beforeEach(async () => {
    const mockUserRepo: Partial<jest.Mocked<IUserAuthRepository>> = {
      findByEmail: jest.fn(),
    };

    const mockSessionRepo: Partial<jest.Mocked<IUserSessionRepository>> = {
      createSession: jest.fn(),
    };

    const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    const mockTokenService: Partial<jest.Mocked<ITokenService>> = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: IUserAuthRepository,
          useValue: mockUserRepo,
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
          provide: ITokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepo = module.get(IUserAuthRepository);
    sessionRepo = module.get(IUserSessionRepository);
    passwordService = module.get(IPasswordService);
    tokenService = module.get(ITokenService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const loginParams = {
      email: 'test@example.com',
      password: 'password123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      deviceName: 'Chrome Browser',
    };

    it('should successfully login a user with valid credentials', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);

      const result = await useCase.execute(loginParams);

      expect(result).toEqual({
        accessToken: 'accessToken123',
        refreshToken: 'refreshToken123',
        userId: 'user-123',
      });
      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');

      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'user-123',
        role: Role.USER_FREEMIUM,
        mfaEnabled: false,
        mfaVerified: false,
      });

      expect(sessionRepo.createSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');
      expect(passwordService.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');
      expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should create session with correct expiration date (30 days)', async () => {
      const now = new Date('2024-01-01T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);

      await useCase.execute(loginParams);

      const expectedExpiry = new Date('2024-01-31T00:00:00Z');
      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          deviceName: 'Chrome Browser',
          expiresAt: expectedExpiry,
          isRevoked: false,
        }),
      );

      jest.restoreAllMocks();
    });

    it('should use default device name when not provided', async () => {
      const paramsWithoutDevice = { ...loginParams, deviceName: undefined };

      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);

      await useCase.execute(paramsWithoutDevice);

      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceName: 'web',
        }),
      );
    });

    it('should hash the refresh token before storing', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);

      await useCase.execute(loginParams);

      expect(passwordService.hash).toHaveBeenCalledWith('refreshToken123');
      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: 'hashedRefreshToken',
        }),
      );
    });

    it('should generate tokens with correct payload structure', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);

      await useCase.execute(loginParams);

      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
        sub: 'user-123',
        sessionId: expect.any(String),
      });

      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'user-123',
        role: Role.USER_FREEMIUM,
        mfaEnabled: false,
        mfaVerified: false,
      });
    });
  });
});
