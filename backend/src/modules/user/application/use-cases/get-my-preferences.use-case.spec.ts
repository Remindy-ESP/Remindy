import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetMyPreferencesUseCase } from './get-my-preferences.use-case';
import { UserPreferencesRepository } from '../../infrastructure/repositories/user-preferences.repository';
import { UserPreferenceEntity, Theme } from 'src/infrastructure/database/entities/user-preference.entity';

describe('GetMyPreferencesUseCase', () => {
  let useCase: GetMyPreferencesUseCase;
  let preferencesRepo: jest.Mocked<UserPreferencesRepository>;

  beforeEach(async () => {
    const mockPreferencesRepo = {
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyPreferencesUseCase,
        {
          provide: UserPreferencesRepository,
          useValue: mockPreferencesRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetMyPreferencesUseCase>(GetMyPreferencesUseCase);
    preferencesRepo = module.get(UserPreferencesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return user preferences when found', async () => {
      const userId = 'user-123';
      const mockPreferences = {
        userId,
        theme: Theme.DARK,
        notificationEmail: true,
        notificationPush: false,
        notificationSms: false,
        defaultReminderDelay: 7,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      preferencesRepo.findByUserId.mockResolvedValue(mockPreferences);

      const result = await useCase.execute(userId);

      expect(result).toBe(mockPreferences);
      expect(preferencesRepo.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when preferences not found', async () => {
      const userId = 'user-404';

      preferencesRepo.findByUserId.mockResolvedValue(null);

      await expect(useCase.execute(userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(userId)).rejects.toThrow('User preferences not found');
    });

    it('should handle different user ids', async () => {
      const users = [
        { id: 'user-1', theme: Theme.LIGHT },
        { id: 'user-2', theme: Theme.DARK },
        { id: 'user-3', theme: Theme.AUTO },
      ];

      for (const user of users) {
        const mockPreferences = {
          userId: user.id,
          theme: user.theme,
          notificationEmail: true,
          notificationPush: true,
          notificationSms: false,
          defaultReminderDelay: 3,
          currency: 'EUR',
          showOnlineStatus: true,
        } as UserPreferenceEntity;

        preferencesRepo.findByUserId.mockResolvedValue(mockPreferences);

        const result = await useCase.execute(user.id);

        expect(result.userId).toBe(user.id);
        expect(result.theme).toBe(user.theme);
      }
    });

    it('should return preferences with all fields', async () => {
      const userId = 'user-complete';
      const mockPreferences = {
        userId,
        theme: Theme.AUTO,
        notificationEmail: false,
        notificationPush: true,
        notificationSms: true,
        defaultReminderDelay: 30,
        currency: 'USD',
        showOnlineStatus: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      } as UserPreferenceEntity;

      preferencesRepo.findByUserId.mockResolvedValue(mockPreferences);

      const result = await useCase.execute(userId);

      expect(result).toEqual(mockPreferences);
      expect(result.theme).toBe(Theme.AUTO);
      expect(result.notificationEmail).toBe(false);
      expect(result.notificationPush).toBe(true);
      expect(result.notificationSms).toBe(true);
      expect(result.defaultReminderDelay).toBe(30);
      expect(result.currency).toBe('USD');
      expect(result.showOnlineStatus).toBe(false);
    });
  });
});
