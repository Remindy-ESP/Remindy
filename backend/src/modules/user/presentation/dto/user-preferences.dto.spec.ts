import { validate } from 'class-validator';
import { UpdateUserPreferencesDto, UserPreferencesResponseDto } from './user-preferences.dto';
import {
  UserPreferenceEntity,
  Theme,
} from 'src/infrastructure/database/entities/user-preference.entity';

describe('UpdateUserPreferencesDto', () => {
  describe('validation', () => {
    it('should accept valid preferences data', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.theme = 'dark';
      dto.notificationEmail = true;
      dto.notificationPush = false;
      dto.notificationSms = false;
      dto.defaultReminderDelay = 7;
      dto.currency = 'EUR';
      dto.showOnlineStatus = true;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty optional fields', async () => {
      const dto = new UpdateUserPreferencesDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid theme values', async () => {
      const validThemes = ['light', 'dark', 'auto'];

      for (const theme of validThemes) {
        const dto = new UpdateUserPreferencesDto();
        dto.theme = theme;

        const errors = await validate(dto);
        const themeErrors = errors.filter(e => e.property === 'theme');
        expect(themeErrors).toHaveLength(0);
      }
    });

    it('should reject invalid theme value', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.theme = 'invalid-theme';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const themeError = errors.find(e => e.property === 'theme');
      expect(themeError).toBeDefined();
      expect(themeError?.constraints).toHaveProperty('isIn');
    });

    it('should accept valid boolean notification preferences', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.notificationEmail = true;
      dto.notificationPush = false;
      dto.notificationSms = true;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid reminder delay within range', async () => {
      const validDelays = [1, 3, 7, 30, 365];

      for (const delay of validDelays) {
        const dto = new UpdateUserPreferencesDto();
        dto.defaultReminderDelay = delay;

        const errors = await validate(dto);
        const delayErrors = errors.filter(e => e.property === 'defaultReminderDelay');
        expect(delayErrors).toHaveLength(0);
      }
    });

    it('should reject reminder delay below minimum', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.defaultReminderDelay = 0;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const delayError = errors.find(e => e.property === 'defaultReminderDelay');
      expect(delayError).toBeDefined();
    });

    it('should reject reminder delay above maximum', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.defaultReminderDelay = 366;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const delayError = errors.find(e => e.property === 'defaultReminderDelay');
      expect(delayError).toBeDefined();
    });

    it('should reject non-integer reminder delay', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.defaultReminderDelay = 7.5;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const delayError = errors.find(e => e.property === 'defaultReminderDelay');
      expect(delayError).toBeDefined();
    });

    it('should accept valid currency codes', async () => {
      const validCurrencies = ['EUR', 'USD', 'GBP', 'JPY'];

      for (const currency of validCurrencies) {
        const dto = new UpdateUserPreferencesDto();
        dto.currency = currency;

        const errors = await validate(dto);
        const currencyErrors = errors.filter(e => e.property === 'currency');
        expect(currencyErrors).toHaveLength(0);
      }
    });

    it('should reject currency longer than 3 characters', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.currency = 'EURO';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const currencyError = errors.find(e => e.property === 'currency');
      expect(currencyError).toBeDefined();
    });

    it('should accept partial preference updates', async () => {
      const dto = new UpdateUserPreferencesDto();
      dto.theme = 'dark';
      // Other fields are optional

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('UserPreferencesResponseDto', () => {
  describe('fromEntity', () => {
    it('should map entity to DTO correctly', () => {
      const entity = new UserPreferenceEntity();
      entity.userId = 'user-123';
      entity.theme = Theme.DARK;
      entity.notificationEmail = true;
      entity.notificationPush = false;
      entity.notificationSms = false;
      entity.defaultReminderDelay = 7;
      entity.currency = 'EUR';
      entity.showOnlineStatus = true;
      entity.createdAt = new Date('2024-01-01');
      entity.updatedAt = new Date('2024-01-15');

      const dto = UserPreferencesResponseDto.fromEntity(entity);

      expect(dto.userId).toBe('user-123');
      expect(dto.theme).toBe('dark');
      expect(dto.notificationEmail).toBe(true);
      expect(dto.notificationPush).toBe(false);
      expect(dto.notificationSms).toBe(false);
      expect(dto.defaultReminderDelay).toBe(7);
      expect(dto.currency).toBe('EUR');
      expect(dto.showOnlineStatus).toBe(true);
      expect(dto.createdAt).toEqual(new Date('2024-01-01'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-15'));
    });

    it('should handle different theme values', () => {
      const themes: Theme[] = [Theme.LIGHT, Theme.DARK, Theme.AUTO];

      themes.forEach(theme => {
        const entity = new UserPreferenceEntity();
        entity.userId = 'user-123';
        entity.theme = theme;
        entity.notificationEmail = true;
        entity.notificationPush = true;
        entity.notificationSms = false;
        entity.defaultReminderDelay = 3;
        entity.currency = 'USD';
        entity.showOnlineStatus = true;
        entity.createdAt = new Date();
        entity.updatedAt = new Date();

        const dto = UserPreferencesResponseDto.fromEntity(entity);
        expect(dto.theme).toBe(theme);
      });
    });

    it('should handle different currency values', () => {
      const currencies = ['EUR', 'USD', 'GBP', 'JPY'];

      currencies.forEach(currency => {
        const entity = new UserPreferenceEntity();
        entity.userId = 'user-123';
        entity.theme = Theme.LIGHT;
        entity.notificationEmail = true;
        entity.notificationPush = true;
        entity.notificationSms = false;
        entity.defaultReminderDelay = 3;
        entity.currency = currency;
        entity.showOnlineStatus = true;
        entity.createdAt = new Date();
        entity.updatedAt = new Date();

        const dto = UserPreferencesResponseDto.fromEntity(entity);
        expect(dto.currency).toBe(currency);
      });
    });
  });
});
