import { UserPreferencesMapper } from './user-preferences.mapper';
import { UpdateUserPreferencesDto } from '../dto';
import { Theme } from 'src/infrastructure/database/entities/user-preference.entity';

describe('UserPreferencesMapper', () => {
  describe('toInput', () => {
    it('should map all fields from dto to input', () => {
      const dto: UpdateUserPreferencesDto = {
        theme: 'dark',
        notificationEmail: true,
        notificationPush: false,
        notificationSms: true,
        defaultReminderDelay: 7,
        currency: 'USD',
        showOnlineStatus: false,
      };

      const result = UserPreferencesMapper.toInput(dto);

      expect(result).toEqual({
        theme: 'dark' as Theme,
        notificationEmail: true,
        notificationPush: false,
        notificationSms: true,
        defaultReminderDelay: 7,
        currency: 'USD',
        showOnlineStatus: false,
      });
    });

    it('should map partial dto with only theme', () => {
      const dto: UpdateUserPreferencesDto = {
        theme: 'light',
      };

      const result = UserPreferencesMapper.toInput(dto);

      expect(result.theme).toBe('light');
      expect(result.notificationEmail).toBeUndefined();
      expect(result.notificationPush).toBeUndefined();
      expect(result.notificationSms).toBeUndefined();
      expect(result.defaultReminderDelay).toBeUndefined();
      expect(result.currency).toBeUndefined();
      expect(result.showOnlineStatus).toBeUndefined();
    });

    it('should map dto with auto theme', () => {
      const dto: UpdateUserPreferencesDto = {
        theme: 'auto',
        notificationEmail: false,
      };

      const result = UserPreferencesMapper.toInput(dto);

      expect(result.theme).toBe('auto' as Theme);
      expect(result.notificationEmail).toBe(false);
    });

    it('should map dto with boolean flags set to false', () => {
      const dto: UpdateUserPreferencesDto = {
        notificationEmail: false,
        notificationPush: false,
        notificationSms: false,
        showOnlineStatus: false,
      };

      const result = UserPreferencesMapper.toInput(dto);

      expect(result.notificationEmail).toBe(false);
      expect(result.notificationPush).toBe(false);
      expect(result.notificationSms).toBe(false);
      expect(result.showOnlineStatus).toBe(false);
    });

    it('should map dto with reminder delay', () => {
      const dto: UpdateUserPreferencesDto = {
        defaultReminderDelay: 30,
      };

      const result = UserPreferencesMapper.toInput(dto);

      expect(result.defaultReminderDelay).toBe(30);
    });

    it('should map dto with currency', () => {
      const dto: UpdateUserPreferencesDto = {
        currency: 'EUR',
      };

      const result = UserPreferencesMapper.toInput(dto);

      expect(result.currency).toBe('EUR');
    });

    it('should handle empty dto', () => {
      const dto: UpdateUserPreferencesDto = {};

      const result = UserPreferencesMapper.toInput(dto);

      expect(result.theme).toBeUndefined();
      expect(result.notificationEmail).toBeUndefined();
      expect(result.notificationPush).toBeUndefined();
      expect(result.notificationSms).toBeUndefined();
      expect(result.defaultReminderDelay).toBeUndefined();
      expect(result.currency).toBeUndefined();
      expect(result.showOnlineStatus).toBeUndefined();
    });
  });
});
