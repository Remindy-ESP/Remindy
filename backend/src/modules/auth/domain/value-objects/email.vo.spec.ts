import { Email } from './email.vo';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create a valid email', () => {
      const email = new Email('test@example.com');

      expect(email.getValue()).toBe('test@example.com');
    });

    it('should create an email and convert to lowercase', () => {
      const email = new Email('TEST@EXAMPLE.COM');

      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => new Email('invalid-email')).toThrow('Invalid email format');
    });

    it('should throw error for empty email', () => {
      expect(() => new Email('')).toThrow('Invalid email format');
    });

    it('should throw error for email without domain', () => {
      expect(() => new Email('test@')).toThrow('Invalid email format');
    });

    it('should throw error for email without @', () => {
      expect(() => new Email('testexample.com')).toThrow('Invalid email format');
    });

    it('should accept email with subdomain', () => {
      const email = new Email('test@mail.example.com');

      expect(email.getValue()).toBe('test@mail.example.com');
    });

    it('should accept email with numbers', () => {
      const email = new Email('test123@example.com');

      expect(email.getValue()).toBe('test123@example.com');
    });

    it('should accept email with dots and hyphens', () => {
      const email = new Email('test.user-name@example.com');

      expect(email.getValue()).toBe('test.user-name@example.com');
    });
  });

  describe('getValue', () => {
    it('should return the email value', () => {
      const email = new Email('user@domain.com');

      expect(email.getValue()).toBe('user@domain.com');
    });
  });
});
