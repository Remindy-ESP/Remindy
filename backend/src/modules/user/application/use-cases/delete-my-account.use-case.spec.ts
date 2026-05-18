import { Test, TestingModule } from '@nestjs/testing';
import { DeleteMyAccountUseCase } from './delete-my-account.use-case';
import { UserRepository } from '../../domain/repositories/user-user.repository';
import { AbstractUserSessionRepository } from '../../domain/repositories/user-session-repository';

describe('DeleteMyAccountUseCase', () => {
  let useCase: DeleteMyAccountUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let sessionRepo: jest.Mocked<AbstractUserSessionRepository>;

  beforeEach(async () => {
    const mockUserRepo = {
      softDelete: jest.fn(),
    };

    const mockSessionRepo = {
      revokeAllForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteMyAccountUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepo,
        },
        {
          provide: AbstractUserSessionRepository,
          useValue: mockSessionRepo,
        },
      ],
    }).compile();

    useCase = module.get<DeleteMyAccountUseCase>(DeleteMyAccountUseCase);
    userRepo = module.get(UserRepository);
    sessionRepo = module.get(AbstractUserSessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should revoke all sessions and soft delete user account', async () => {
      const userId = 'user-123';

      sessionRepo.revokeAllForUser.mockResolvedValue(undefined);
      userRepo.softDelete.mockResolvedValue(undefined);

      await useCase.execute(userId);

      expect(sessionRepo.revokeAllForUser).toHaveBeenCalledWith(userId);
      expect(userRepo.softDelete).toHaveBeenCalledWith(userId);
    });

    it('should revoke sessions before deleting user', async () => {
      const userId = 'user-456';
      const callOrder: string[] = [];

      sessionRepo.revokeAllForUser.mockImplementation(() => {
        callOrder.push('revokeAllForUser');
        return Promise.resolve();
      });

      userRepo.softDelete.mockImplementation(() => {
        callOrder.push('softDelete');
        return Promise.resolve();
      });

      await useCase.execute(userId);

      expect(callOrder).toEqual(['revokeAllForUser', 'softDelete']);
    });

    // Branch: !userId — empty string (falsy)
    it('should throw error when userId is empty string', async () => {
      await expect(useCase.execute('')).rejects.toThrow(
        'DeleteMyAccountUseCase called without userId',
      );

      expect(sessionRepo.revokeAllForUser).not.toHaveBeenCalled();
      expect(userRepo.softDelete).not.toHaveBeenCalled();
    });

    // Branch: !userId — null (falsy)
    it('should throw error when userId is null', async () => {
      await expect(useCase.execute(null as any)).rejects.toThrow(
        'DeleteMyAccountUseCase called without userId',
      );

      expect(sessionRepo.revokeAllForUser).not.toHaveBeenCalled();
      expect(userRepo.softDelete).not.toHaveBeenCalled();
    });

    // Branch: !userId — undefined (falsy)
    it('should throw error when userId is undefined', async () => {
      await expect(useCase.execute(undefined as any)).rejects.toThrow(
        'DeleteMyAccountUseCase called without userId',
      );

      expect(sessionRepo.revokeAllForUser).not.toHaveBeenCalled();
      expect(userRepo.softDelete).not.toHaveBeenCalled();
    });

    it('should handle different user ids', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      sessionRepo.revokeAllForUser.mockResolvedValue(undefined);
      userRepo.softDelete.mockResolvedValue(undefined);

      for (const userId of userIds) {
        await useCase.execute(userId);
        expect(sessionRepo.revokeAllForUser).toHaveBeenCalledWith(userId);
        expect(userRepo.softDelete).toHaveBeenCalledWith(userId);
      }

      expect(sessionRepo.revokeAllForUser).toHaveBeenCalledTimes(3);
      expect(userRepo.softDelete).toHaveBeenCalledTimes(3);
    });
  });
});
