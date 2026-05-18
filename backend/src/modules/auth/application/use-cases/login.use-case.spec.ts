import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

const baseUser = {
  getId: () => 'user-123',
  getEmail: () => 'test@example.com',
  getPasswordHash: () => 'hash',
  getRoleKey: () => Role.USER_FREEMIUM,
  isMfaEnabled: () => false,
  isMfaVerified: () => false,
  getStatus: () => UserStatus.ACTIVE,
  getFailedLoginCount: () => 0,
};

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: any;
  let sessionRepo: any;
  let passwordService: any;
  let tokenService: any;
  let eventEmitter: any;

  const loginParams = {
    email: 'test@example.com',
    password: 'password123',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: IUserAuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            incrementFailedLoginCount: jest.fn(),
            resetFailedLoginCount: jest.fn(),
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
            compare: jest.fn(),
            hash: jest.fn(),
          },
        },
        {
          provide: ITokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
    userRepo = module.get(IUserAuthRepository);
    sessionRepo = module.get(IUserSessionRepository);
    passwordService = module.get(IPasswordService);
    tokenService = module.get(ITokenService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('SUCCESS login', async () => {
    userRepo.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(true);
    tokenService.generateAccessToken.mockReturnValue('a');
    tokenService.generateRefreshToken.mockReturnValue('r');
    sessionRepo.createSession.mockResolvedValue(undefined);
    userRepo.resetFailedLoginCount.mockResolvedValue(undefined);
    userRepo.updateLastLoginAt.mockResolvedValue(undefined);

    const res = await useCase.execute(loginParams);

    expect(res.accessToken).toBe('a');
    expect(eventEmitter.emit).toHaveBeenCalledWith('security.login.success', expect.any(Object));
  });

  it('USER NOT FOUND', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(loginParams)).rejects.toThrow(UnauthorizedException);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'security.login.failure',
      expect.objectContaining({
        metadata: { reason: 'user_not_found' },
      }),
    );
  });

  it('INACTIVE USER', async () => {
    userRepo.findByEmail.mockResolvedValue({
      ...baseUser,
      getStatus: () => UserStatus.INACTIVE,
    });

    await expect(useCase.execute(loginParams)).rejects.toThrow('Account is inactive');
  });

  it('INVALID PASSWORD BELOW THRESHOLD', async () => {
    userRepo.findByEmail.mockResolvedValue({
      ...baseUser,
      getFailedLoginCount: () => 1,
    });

    passwordService.compare.mockResolvedValue(false);
    userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

    await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'security.login.failure',
      expect.objectContaining({
        metadata: expect.objectContaining({
          reason: 'invalid_password',
        }),
      }),
    );
  });

  it('BRUTE FORCE THRESHOLD REACHED', async () => {
    userRepo.findByEmail.mockResolvedValue({
      ...baseUser,
      getFailedLoginCount: () => 4,
    });

    passwordService.compare.mockResolvedValue(false);
    userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

    await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'security.login.brute_force',
      expect.objectContaining({
        metadata: expect.objectContaining({
          attempts: 5,
        }),
      }),
    );
  });

  it('DEVICE NAME FALLBACK', async () => {
    userRepo.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(true);
    tokenService.generateAccessToken.mockReturnValue('a');
    tokenService.generateRefreshToken.mockReturnValue('r');
    sessionRepo.createSession.mockResolvedValue(undefined);

    await useCase.execute({
      ...loginParams,
      deviceName: undefined,
    });

    expect(sessionRepo.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ deviceName: 'web' }),
    );
  });

  it('getFailedLoginCount missing => fallback 0', async () => {
    const user = {
      ...baseUser,
    };
    delete user.getFailedLoginCount;

    userRepo.findByEmail.mockResolvedValue(user);

    passwordService.compare.mockResolvedValue(false);

    await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');
  });

  it('getStatus missing => ACTIVE fallback', async () => {
    const user = {
      ...baseUser,
    };
    delete user.getStatus;

    userRepo.findByEmail.mockResolvedValue(user);

    passwordService.compare.mockResolvedValue(true);
    tokenService.generateAccessToken.mockReturnValue('a');
    tokenService.generateRefreshToken.mockReturnValue('r');
    sessionRepo.createSession.mockResolvedValue(undefined);

    await useCase.execute(loginParams);

    expect(eventEmitter.emit).toHaveBeenCalledWith('security.login.success', expect.any(Object));
  });
  it('ACCOUNT ALREADY LOCKED (failedCount >= 5 on entry)', async () => {
    userRepo.findByEmail.mockResolvedValue({
      ...baseUser,
      getFailedLoginCount: () => 5,
    });

    await expect(useCase.execute(loginParams)).rejects.toThrow(
      'Account temporarily locked due to too many failed attempts',
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'security.login.brute_force',
      expect.objectContaining({
        metadata: expect.objectContaining({ attempts: 5 }),
      }),
    );
    expect(userRepo.incrementFailedLoginCount).not.toHaveBeenCalled();
  });

  it('should fallback BOTH status and failedLoginCount when methods missing', async () => {
    const user = {
      getId: () => '1',
      getEmail: () => 't@test.com',
      getPasswordHash: () => 'hash',
      getRoleKey: () => Role.USER_FREEMIUM,
      isMfaEnabled: () => false,
      isMfaVerified: () => false,
    } as any;

    userRepo.findByEmail.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(false);
    userRepo.incrementFailedLoginCount.mockResolvedValue(undefined);

    await expect(useCase.execute(loginParams)).rejects.toThrow('Invalid credentials');

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'security.login.failure',
      expect.objectContaining({
        metadata: expect.objectContaining({
          reason: 'invalid_password',
          attempts: 1,
        }),
      }),
    );
  });
});
