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
import { EventEmitter2 } from '@nestjs/event-emitter';
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

  const mockEventEmitter: Partial<jest.Mocked<EventEmitter2>> = {
    emit: jest.fn(),
    emitAsync: jest.fn(),
  };

  beforeEach(async () => {
    const mockUserRepo: Partial<jest.Mocked<IUserAuthRepository>> = {
      findByEmail: jest.fn(),
      resetFailedLoginCount: jest.fn().mockResolvedValue(undefined),
      incrementFailedLoginCount: jest.fn().mockResolvedValue(undefined),
      updateLastLoginAt: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
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
      userRepo.resetFailedLoginCount.mockResolvedValue(undefined);

      const result = await useCase.execute(loginParams);

      expect(result).toEqual({
        accessToken: 'accessToken123',
        refreshToken: 'refreshToken123',
        userId: 'user-123',
      });
      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(userRepo.resetFailedLoginCount).toHaveBeenCalledWith('user-123');

      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'user-123',
        role: Role.USER_FREEMIUM,
        mfaEnabled: false,
        mfaVerified: false,
      });

      expect(sessionRepo.createSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);
      userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');
      expect(userRepo.incrementFailedLoginCount).toHaveBeenCalledWith('user-123');
      expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    });
  });
});
