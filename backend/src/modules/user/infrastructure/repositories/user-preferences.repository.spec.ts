import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserPreferencesRepository } from './user-preferences.repository';
import {
  UserPreferenceEntity,
  Theme,
} from '../../../../infrastructure/database/entities/user-preference.entity';

describe('UserPreferencesRepository', () => {
  let repository: UserPreferencesRepository;
  let typeOrmRepository: jest.Mocked<Repository<UserPreferenceEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferencesRepository,
        {
          provide: getRepositoryToken(UserPreferenceEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserPreferencesRepository>(UserPreferencesRepository);
    typeOrmRepository = module.get(getRepositoryToken(UserPreferenceEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should find preferences by user id', async () => {
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

      typeOrmRepository.findOne.mockResolvedValue(mockPreferences);

      const result = await repository.findByUserId(userId);

      expect(result).toBe(mockPreferences);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { userId, deletedAt: IsNull() },
      });
    });

    it('should return null when preferences not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByUserId('non-existent');

      expect(result).toBeNull();
    });

    it('should exclude soft deleted preferences', async () => {
      const userId = 'user-123';
      typeOrmRepository.findOne.mockResolvedValue(null);

      await repository.findByUserId(userId);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: IsNull() }),
        }),
      );
    });
  });

  describe('createDefaultPreferences', () => {
    it('should create default preferences for user', async () => {
      const userId = 'user-123';
      const defaultPrefs = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        defaultReminderDelay: 3,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      typeOrmRepository.create.mockReturnValue(defaultPrefs);
      typeOrmRepository.save.mockResolvedValue(defaultPrefs);

      const result = await repository.createDefaultPreferences(userId);

      expect(result).toBe(defaultPrefs);
      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        defaultReminderDelay: 3,
        currency: 'EUR',
        showOnlineStatus: true,
        monthlyReportEnabled: true,
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(defaultPrefs);
    });

    it('should create preferences with light theme by default', async () => {
      const userId = 'user-456';
      const defaultPrefs = {
        userId,
        theme: Theme.LIGHT,
      } as UserPreferenceEntity;

      typeOrmRepository.create.mockReturnValue(defaultPrefs);
      typeOrmRepository.save.mockResolvedValue(defaultPrefs);

      await repository.createDefaultPreferences(userId);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ theme: Theme.LIGHT }),
      );
    });

    it('should create preferences with email notifications enabled by default', async () => {
      const userId = 'user-789';
      const defaultPrefs = {} as UserPreferenceEntity;

      typeOrmRepository.create.mockReturnValue(defaultPrefs);
      typeOrmRepository.save.mockResolvedValue(defaultPrefs);

      await repository.createDefaultPreferences(userId);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationEmail: true,
          notificationPush: true,
          notificationSms: false,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update existing preferences', async () => {
      const userId = 'user-123';
      const existingPrefs = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        defaultReminderDelay: 3,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      const updateData = {
        theme: Theme.DARK,
        notificationEmail: false,
      };

      const updatedPrefs = {
        ...existingPrefs,
        ...updateData,
      };

      typeOrmRepository.findOne.mockResolvedValue(existingPrefs);
      typeOrmRepository.save.mockResolvedValue(updatedPrefs);

      const result = await repository.update(userId, updateData);

      expect(result).toBe(updatedPrefs);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: Theme.DARK,
          notificationEmail: false,
        }),
      );
    });

    it('should create default preferences if none exist and then update', async () => {
      const userId = 'user-new';
      const updateData = { theme: Theme.DARK };

      const defaultPrefs = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        defaultReminderDelay: 3,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      const updatedPrefs = {
        ...defaultPrefs,
        theme: Theme.DARK,
      } as UserPreferenceEntity;

      // First call: findByUserId returns null
      typeOrmRepository.findOne.mockResolvedValue(null);
      // Create default preferences
      typeOrmRepository.create.mockReturnValue(defaultPrefs);
      // Save is called twice: once for create, once for update
      typeOrmRepository.save
        .mockResolvedValueOnce(defaultPrefs)
        .mockResolvedValueOnce(updatedPrefs);

      const result = await repository.update(userId, updateData);

      expect(typeOrmRepository.create).toHaveBeenCalled();
      expect(typeOrmRepository.save).toHaveBeenCalledTimes(2);
      expect(result.theme).toBe(Theme.DARK);
    });

    it('should update only provided fields', async () => {
      const userId = 'user-123';
      const existingPrefs = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        defaultReminderDelay: 3,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      const updateData = { theme: Theme.DARK };

      typeOrmRepository.findOne.mockResolvedValue(existingPrefs);
      typeOrmRepository.save.mockResolvedValue({
        ...existingPrefs,
        theme: Theme.DARK,
      });

      await repository.update(userId, updateData);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: Theme.DARK,
          notificationEmail: true, // unchanged
          notificationPush: true, // unchanged
        }),
      );
    });

    it('should handle all updatable fields', async () => {
      const userId = 'user-123';
      const existingPrefs = {
        userId,
        theme: Theme.LIGHT,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        defaultReminderDelay: 3,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      const updateData = {
        theme: Theme.DARK,
        notificationEmail: false,
        notificationPush: false,
        notificationSms: true,
        defaultReminderDelay: 7,
        currency: 'USD',
        showOnlineStatus: false,
      };

      typeOrmRepository.findOne.mockResolvedValue(existingPrefs);
      typeOrmRepository.save.mockResolvedValue({
        ...existingPrefs,
        ...updateData,
      });

      const result = await repository.update(userId, updateData);

      expect(result).toMatchObject(updateData);
    });
  });

  describe('save', () => {
    it('should save preferences entity', async () => {
      const preferences = {
        userId: 'user-123',
        theme: Theme.DARK,
        notificationEmail: true,
        notificationPush: false,
        notificationSms: false,
        defaultReminderDelay: 7,
        currency: 'EUR',
        showOnlineStatus: true,
      } as UserPreferenceEntity;

      typeOrmRepository.save.mockResolvedValue(preferences);

      const result = await repository.save(preferences);

      expect(result).toBe(preferences);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(preferences);
    });
  });

  describe('softDelete', () => {
    it('should soft delete preferences by user id', async () => {
      const userId = 'user-123';

      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      await repository.softDelete(userId);

      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({ userId });
    });

    it('should handle soft delete for different users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      for (const userId of userIds) {
        await repository.softDelete(userId);
        expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({ userId });
      }

      expect(typeOrmRepository.softDelete).toHaveBeenCalledTimes(3);
    });
  });
});
