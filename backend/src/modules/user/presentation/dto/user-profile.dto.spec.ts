import { validate } from 'class-validator';
import { UpdateUserProfileDto } from './user-profile.dto';

describe('UpdateUserProfileDto', () => {
  describe('validation', () => {
    it('should accept valid profile data', async () => {
      const dto = new UpdateUserProfileDto();
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.phone = '+33612345678';
      dto.timezone = 'Europe/Paris';
      dto.language = 'fr';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty optional fields', async () => {
      const dto = new UpdateUserProfileDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject firstName longer than 100 characters', async () => {
      const dto = new UpdateUserProfileDto();
      dto.firstName = 'a'.repeat(101);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('firstName');
    });

    it('should reject lastName longer than 100 characters', async () => {
      const dto = new UpdateUserProfileDto();
      dto.lastName = 'a'.repeat(101);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('lastName');
    });

    it('should accept valid phone number formats', async () => {
      const validNumbers = ['+33612345678', '0612345678', '+1234567890', '(123) 456-7890'];

      for (const phone of validNumbers) {
        const dto = new UpdateUserProfileDto();
        dto.phone = phone;

        const errors = await validate(dto);
        const phoneErrors = errors.filter(e => e.property === 'phone');
        expect(phoneErrors).toHaveLength(0);
      }
    });

    it('should reject invalid phone number format', async () => {
      const dto = new UpdateUserProfileDto();
      dto.phone = 'invalid-phone';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const phoneError = errors.find(e => e.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints).toHaveProperty('matches');
    });

    it('should accept valid timezone', async () => {
      const dto = new UpdateUserProfileDto();
      dto.timezone = 'America/New_York';

      const errors = await validate(dto);
      const timezoneErrors = errors.filter(e => e.property === 'timezone');
      expect(timezoneErrors).toHaveLength(0);
    });

    it('should reject timezone longer than 50 characters', async () => {
      const dto = new UpdateUserProfileDto();
      dto.timezone = 'a'.repeat(51);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('timezone');
    });

    it('should accept valid language codes', async () => {
      const validLanguages = ['fr', 'en', 'es', 'de'];

      for (const language of validLanguages) {
        const dto = new UpdateUserProfileDto();
        dto.language = language;

        const errors = await validate(dto);
        const languageErrors = errors.filter(e => e.property === 'language');
        expect(languageErrors).toHaveLength(0);
      }
    });

    it('should reject language longer than 10 characters', async () => {
      const dto = new UpdateUserProfileDto();
      dto.language = 'a'.repeat(11);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('language');
    });

    it('should accept partial profile updates', async () => {
      const dto = new UpdateUserProfileDto();
      dto.firstName = 'John';
      // Other fields are optional

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
