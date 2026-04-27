import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MfaRequiredGuard } from './mfa-required.guard';
import { EUser } from 'src/infrastructure/database/entities/user.entity';

describe('MfaRequiredGuard', () => {
  let guard: MfaRequiredGuard;
  let userRepository: jest.Mocked<Repository<EUser>>;

  const createMockExecutionContext = (user: { userId?: string } | undefined): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaRequiredGuard,
        {
          provide: getRepositoryToken(EUser),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    guard = module.get<MfaRequiredGuard>(MfaRequiredGuard);
    userRepository = module.get(getRepositoryToken(EUser));
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when user has MFA enabled', async () => {
    const context = createMockExecutionContext({ userId: 'user-123' });

    userRepository.findOne.mockResolvedValue({
      id: 'user-123',
      mfaEnabled: true,
    } as EUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: ['id', 'mfaEnabled'],
    });
  });

  it('should throw ForbiddenException when MFA is not enabled', async () => {
    const context = createMockExecutionContext({ userId: 'user-456' });

    userRepository.findOne.mockResolvedValue({
      id: 'user-456',
      mfaEnabled: false,
    } as EUser);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'MFA is required to access audit logs. Please enable MFA in your account settings.',
    );
  });

  it('should throw ForbiddenException when user is not found', async () => {
    const context = createMockExecutionContext({ userId: 'non-existent' });

    userRepository.findOne.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('User not found');
  });

  it('should throw ForbiddenException when no user in request', async () => {
    const context = createMockExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
  });

  it('should throw ForbiddenException when userId is missing', async () => {
    const context = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
  });

  it('should query only required fields from database', async () => {
    const context = createMockExecutionContext({ userId: 'user-789' });

    userRepository.findOne.mockResolvedValue({
      id: 'user-789',
      mfaEnabled: true,
    } as EUser);

    await guard.canActivate(context);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-789' },
      select: ['id', 'mfaEnabled'],
    });
  });
});
