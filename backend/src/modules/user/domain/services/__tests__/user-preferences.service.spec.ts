import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserPreferencesService } from '../user-preferences.service';
import { UserPreferencesRepository } from '../../../infrastructure/repositories/user-preferences.repository';
import { UserTypeOrmRepository } from '../../../infrastructure/repositories/user-typeorm.repository';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let userPreferencesRepository: jest.Mocked<UserPreferencesRepository>;
  let userRepository: jest.Mocked<UserTypeOrmRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockPreferences = {
    userId: 'user-123',
    theme: 'dark' as const,
    notificationEmail: true,
    notificationPush: true,
    notificationSms: false,
    defaultReminderDelay: 3,
    currency: 'EUR',
    showOnlineStatus: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserPreferencesRepo = {
      findByUserId: jest.fn(),
      createDefaultPreferences: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferencesService,
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepo,
        },
        {
          provide: UserTypeOrmRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<UserPreferencesService>(UserPreferencesService);
    userPreferencesRepository = module.get(UserPreferencesRepository);
    userRepository = module.get(UserTypeOrmRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPreferences', () => {
    it('should return existing user preferences', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);

      const result = await service.getUserPreferences('user-123');

      expect(result).toEqual({
        userId: mockPreferences.userId,
        theme: mockPreferences.theme,
        notificationEmail: mockPreferences.notificationEmail,
        notificationPush: mockPreferences.notificationPush,
        notificationSms: mockPreferences.notificationSms,
        defaultReminderDelay: mockPreferences.defaultReminderDelay,
        currency: mockPreferences.currency,
        showOnlineStatus: mockPreferences.showOnlineStatus,
        createdAt: mockPreferences.createdAt,
        updatedAt: mockPreferences.updatedAt,
      });
    });

    // Branch: preferences is null → ?? createDefaultPreferences
    it('should create default preferences if they do not exist', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(null);
      userPreferencesRepository.createDefaultPreferences.mockResolvedValue(mockPreferences as any);

      const result = await service.getUserPreferences('user-123');

      expect(result).toBeDefined();
      expect(userPreferencesRepository.createDefaultPreferences).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserPreferences('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      const updateDto = {
        theme: 'light' as const,
        notificationEmail: false,
        defaultReminderDelay: 7,
        currency: 'USD',
      };

      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);
      userPreferencesRepository.update.mockResolvedValue({
        ...mockPreferences,
        theme: 'light' as const,
        notificationEmail: false,
        defaultReminderDelay: 7,
        currency: 'USD',
      } as any);

      const result = await service.updateUserPreferences('user-123', updateDto);

      expect(result.theme).toBe('light');
      expect(result.notificationEmail).toBe(false);
      expect(result.currency).toBe('USD');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateUserPreferences('nonexistent-id', { theme: 'dark' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid currency (more than 3 chars)', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);

      await expect(
        service.updateUserPreferences('user-123', { currency: 'INVALID' }),
      ).rejects.toThrow(BadRequestException);
    });

    // Branch: currency is defined but empty string → isValidCurrency not called, no throw
    it('should skip currency validation when currency is empty string', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);
      userPreferencesRepository.update.mockResolvedValue({
        ...mockPreferences,
        currency: '',
      } as any);

      // currency === '' is falsy → the `if (updateDto.currency && ...)` guard short-circuits
      await expect(
        service.updateUserPreferences('user-123', { currency: '' }),
      ).resolves.toBeDefined();
    });

    it('should throw BadRequestException for invalid reminder delay (too low)', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);

      await expect(
        service.updateUserPreferences('user-123', { defaultReminderDelay: 0 }),
      ).rejects.toThrow('Default reminder delay must be between 1 and 365 days');
    });

    it('should throw BadRequestException for invalid reminder delay (too high)', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);

      await expect(
        service.updateUserPreferences('user-123', { defaultReminderDelay: 366 }),
      ).rejects.toThrow('Default reminder delay must be between 1 and 365 days');
    });

    // Branch: preferences is null before update → createDefaultPreferences called
    it('should create preferences if they do not exist before updating', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(null);
      userPreferencesRepository.createDefaultPreferences.mockResolvedValue(mockPreferences as any);
      userPreferencesRepository.update.mockResolvedValue({
        ...mockPreferences,
        theme: 'dark' as const,
      } as any);

      const result = await service.updateUserPreferences('user-123', { theme: 'dark' });

      expect(userPreferencesRepository.createDefaultPreferences).toHaveBeenCalledWith('user-123');
      expect(result.theme).toBe('dark');
    });

    // Branch: !updatedPreferences → throw NotFoundException (line 85)
    it('should throw NotFoundException when update returns null', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);
      userPreferencesRepository.update.mockResolvedValue(null as any);

      await expect(service.updateUserPreferences('user-123', { theme: 'dark' })).rejects.toThrow(
        new NotFoundException('Preferences not found after update'),
      );
    });

    it('should uppercase currency code', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      userPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences as any);
      userPreferencesRepository.update.mockResolvedValue({
        ...mockPreferences,
        currency: 'USD',
      } as any);

      const result = await service.updateUserPreferences('user-123', { currency: 'usd' });

      expect(userPreferencesRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ currency: 'USD' }),
      );
      expect(result.currency).toBe('USD');
    });
  });
});
