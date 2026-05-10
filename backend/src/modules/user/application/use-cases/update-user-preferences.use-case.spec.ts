import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserPreferencesUseCase } from './update-user-preferences.use-case';
import { UserPreferencesRepository } from '../../infrastructure/repositories/user-preferences.repository';
import { UpdateUserPreferencesDto } from '../../presentation/dto';
import {
  UserPreferenceEntity,
  Theme,
} from 'src/infrastructure/database/entities/user-preference.entity';

describe('UpdateUserPreferencesUseCase', () => {
  let useCase: UpdateUserPreferencesUseCase;
  let preferencesRepo: jest.Mocked<UserPreferencesRepository>;

  beforeEach(async () => {
    const mockPreferencesRepo = {
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserPreferencesUseCase,
        {
          provide: UserPreferencesRepository,
          useValue: mockPreferencesRepo,
        },
      ],
    }).compile();

    useCase = module.get<UpdateUserPreferencesUseCase>(UpdateUserPreferencesUseCase);
    preferencesRepo = module.get(UserPreferencesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update user preferences with all fields', async () => {
      const userId = 'user-123';
      const dto: UpdateUserPreferencesDto = {
        theme: 'dark',
        notificationEmail: false,
        notificationPush: true,
        notificationSms: true,
        defaultReminderDelay: 7,
        currency: 'USD',
        showOnlineStatus: false,
      };

      const updatedPreferences = {
        userId,
        ...dto,
        theme: Theme.DARK,
      } as UserPreferenceEntity;

      preferencesRepo.update.mockResolvedValue(updatedPreferences);

      const result = await useCase.execute(userId, dto);

      expect(result).toBe(updatedPreferences);
      expect(preferencesRepo.update).toHaveBeenCalledWith(userId, {
        theme: 'dark',
        notificationEmail: false,
        notificationPush: true,
        notificationSms: true,
        defaultReminderDelay: 7,
        currency: 'USD',
        showOnlineStatus: false,
      });
    });

    // Branch: dto.theme is undefined → passed as undefined (line 8)
    it('should pass undefined theme when not provided', async () => {
      const userId = 'user-no-theme';
      const dto: UpdateUserPreferencesDto = {
        notificationEmail: true,
      };

      const updatedPreferences = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
      } as UserPreferenceEntity;

      preferencesRepo.update.mockResolvedValue(updatedPreferences);

      await useCase.execute(userId, dto);

      expect(preferencesRepo.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ theme: undefined }),
      );
    });

    it('should update with partial preferences', async () => {
      const userId = 'user-456';
      const dto: UpdateUserPreferencesDto = {
        theme: 'light',
      };

      const updatedPreferences = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
      } as UserPreferenceEntity;

      preferencesRepo.update.mockResolvedValue(updatedPreferences);

      const result = await useCase.execute(userId, dto);

      expect(result).toBe(updatedPreferences);
      expect(preferencesRepo.update).toHaveBeenCalledWith(userId, {
        theme: 'light',
        notificationEmail: undefined,
        notificationPush: undefined,
        notificationSms: undefined,
        defaultReminderDelay: undefined,
        currency: undefined,
        showOnlineStatus: undefined,
      });
    });

    it('should handle notification preferences update', async () => {
      const userId = 'user-notif';
      const dto: UpdateUserPreferencesDto = {
        notificationEmail: false,
        notificationPush: false,
        notificationSms: true,
      };

      const updatedPreferences = {
        userId,
        notificationEmail: false,
        notificationPush: false,
        notificationSms: true,
      } as UserPreferenceEntity;

      preferencesRepo.update.mockResolvedValue(updatedPreferences);

      await useCase.execute(userId, dto);

      expect(preferencesRepo.update).toHaveBeenCalledWith(userId, {
        theme: undefined,
        notificationEmail: false,
        notificationPush: false,
        notificationSms: true,
        defaultReminderDelay: undefined,
        currency: undefined,
        showOnlineStatus: undefined,
      });
    });

    it('should handle empty dto (all fields undefined)', async () => {
      const userId = 'user-empty';
      const dto: UpdateUserPreferencesDto = {};

      const updatedPreferences = { userId } as UserPreferenceEntity;
      preferencesRepo.update.mockResolvedValue(updatedPreferences);

      await useCase.execute(userId, dto);

      expect(preferencesRepo.update).toHaveBeenCalledWith(userId, {
        theme: undefined,
        notificationEmail: undefined,
        notificationPush: undefined,
        notificationSms: undefined,
        defaultReminderDelay: undefined,
        currency: undefined,
        showOnlineStatus: undefined,
      });
    });
  });
});
