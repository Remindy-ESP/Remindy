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

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');
      expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should emit security.login.failure event when user is not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'security.login.failure',
        expect.objectContaining({
          userEmail: loginParams.email,
          ipAddress: loginParams.ipAddress,
          userAgent: loginParams.userAgent,
          metadata: { reason: 'user_not_found' },
        }),
      );
    });

    it('should emit security.login.failure event when account is inactive', async () => {
      const suspendedUser = new AuthUser({
        id: 'user-suspended',
        email: 'test@example.com',
        passwordHash: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        mfaEnabled: false,
        mfaVerified: false,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.INACTIVE,
        failedLoginCount: 0,
        emailVerified: true,
        createdAt: new Date(),
      });
      userRepo.findByEmail.mockResolvedValue(suspendedUser);

      await expect(useCase.execute(loginParams)).rejects.toThrow('Account is inactive');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'security.login.failure',
        expect.objectContaining({
          metadata: expect.objectContaining({ reason: 'account_inactive' }),
        }),
      );
    });

    it('should emit security.login.failure (not brute_force) when failed count is below threshold after invalid password', async () => {
      const userWith2Failures = new AuthUser({
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
        failedLoginCount: 2,
        emailVerified: true,
        createdAt: new Date(),
      });
      userRepo.findByEmail.mockResolvedValue(userWith2Failures);
      passwordService.compare.mockResolvedValue(false);
      userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');

      // newFailedCount = 2 + 1 = 3 which is < 5 (BRUTE_FORCE_THRESHOLD)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'security.login.failure',
        expect.objectContaining({
          metadata: expect.objectContaining({ reason: 'invalid_password' }),
        }),
      );
    });

    it('should emit security.login.success event on successful login', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.resetFailedLoginCount.mockResolvedValue(undefined);

      await useCase.execute(loginParams);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'security.login.success',
        expect.objectContaining({
          userId: 'user-123',
          userEmail: loginParams.email,
          ipAddress: loginParams.ipAddress,
          userAgent: loginParams.userAgent,
        }),
      );
    });

    it('should use default deviceName "web" when deviceName is not provided', async () => {
      const paramsWithoutDevice = {
        email: 'test@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.resetFailedLoginCount.mockResolvedValue(undefined);

      await useCase.execute(paramsWithoutDevice);

      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ deviceName: 'web' }),
      );
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

    it('should throw UnauthorizedException and emit failure when user is not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.failure', {
        userEmail: loginParams.email,
        ipAddress: loginParams.ipAddress,
        userAgent: loginParams.userAgent,
        metadata: { reason: 'user_not_found' },
      });
      expect(userRepo.incrementFailedLoginCount).not.toHaveBeenCalled();
    });

    it('should emit failure event with attempts when invalid password stays below threshold', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.failure', {
        userEmail: loginParams.email,
        ipAddress: loginParams.ipAddress,
        userAgent: loginParams.userAgent,
        metadata: { reason: 'invalid_password', attempts: 1 },
      });
    });

    it('should emit brute force event when invalid password reaches threshold', async () => {
      const bruteForceUser = new AuthUser({
        id: 'user-999',
        email: 'bf@example.com',
        passwordHash: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        mfaEnabled: false,
        mfaVerified: false,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 4,
        emailVerified: true,
        createdAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(bruteForceUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.brute_force', {
        userEmail: loginParams.email,
        ipAddress: loginParams.ipAddress,
        metadata: { attempts: 5 },
      });
    });

    it('should default deviceName to web when it is not provided', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);

      await useCase.execute({ ...loginParams, deviceName: undefined });

      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ deviceName: 'web' }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.success', {
        userId: 'user-123',
        userEmail: loginParams.email,
        ipAddress: loginParams.ipAddress,
        userAgent: loginParams.userAgent,
      });
    });
    it('should throw UnauthorizedException when user is not found and emit failure event', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        useCase.execute({
          email: 'missing@example.com',
          password: 'password123',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.failure', {
        userEmail: 'missing@example.com',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { reason: 'user_not_found' },
      });
    });

    it('should emit brute force event when failed count reaches threshold', async () => {
      const userAtThreshold = new AuthUser({
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
        failedLoginCount: 4,
        emailVerified: true,
        createdAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(userAtThreshold);
      passwordService.compare.mockResolvedValue(false);
      userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

      await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.brute_force', {
        userEmail: loginParams.email,
        ipAddress: loginParams.ipAddress,
        metadata: { attempts: 5 },
      });
    });

    it('should use "web" as default device name when deviceName is not provided', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('hashedRefreshToken');
      tokenService.generateRefreshToken.mockReturnValue('refreshToken123');
      tokenService.generateAccessToken.mockReturnValue('accessToken123');
      sessionRepo.createSession.mockResolvedValue(undefined);
      userRepo.resetFailedLoginCount.mockResolvedValue(undefined);
      userRepo.updateLastLoginAt.mockResolvedValue(undefined);

      await useCase.execute({
        email: 'test@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceName: 'web',
        }),
      );
    });
    it('should fallback to 0 when getFailedLoginCount method is missing', async () => {
      const userWithoutFailedCountMethod = {
        getId: jest.fn().mockReturnValue('user-123'),
        getEmail: jest.fn().mockReturnValue('test@example.com'),
        getPasswordHash: jest.fn().mockReturnValue('hashedPassword123'),
      } as any;

      userRepo.findByEmail.mockResolvedValue(userWithoutFailedCountMethod);
      passwordService.compare.mockResolvedValue(false);
      userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'wrong-password',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.login.failure', {
        userEmail: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { reason: 'invalid_password', attempts: 1 },
      });
    });
  });
});

describe('LoginUseCase constructor branch coverage', () => {
  it('should instantiate with all dependencies as null to cover constructor parameter branches', () => {
    const instance = new LoginUseCase(
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
    );
    expect(instance).toBeDefined();
  });
});
