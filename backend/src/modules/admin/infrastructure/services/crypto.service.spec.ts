import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, MFA_SECRET_KEY: 'test-secret-key-for-unit-tests' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('constructor', () => {
    it('throws when MFA_SECRET_KEY is missing', () => {
      delete process.env.MFA_SECRET_KEY;
      expect(() => new CryptoService()).toThrow('MFA_SECRET_KEY is missing');
    });

    it('creates instance successfully when MFA_SECRET_KEY is set', () => {
      expect(() => new CryptoService()).not.toThrow();
    });
  });

  describe('encrypt()', () => {
    it('returns a dot-separated string with 3 parts', () => {
      const service = new CryptoService();
      const result = service.encrypt('hello world');
      const parts = result.split('.');
      expect(parts).toHaveLength(3);
    });

    it('produces different ciphertext for same input (random IV)', () => {
      const service = new CryptoService();
      const a = service.encrypt('same-text');
      const b = service.encrypt('same-text');
      expect(a).not.toBe(b);
    });

    it('produces a non-empty result', () => {
      const service = new CryptoService();
      const result = service.encrypt('some plaintext');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt()', () => {
    it('decrypts an encrypted value back to the original plaintext', () => {
      const service = new CryptoService();
      const plain = 'my-totp-secret-base32';
      const encrypted = service.encrypt(plain);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plain);
    });

    it('round-trips empty string', () => {
      const service = new CryptoService();
      const encrypted = service.encrypt('');
      expect(service.decrypt(encrypted)).toBe('');
    });

    it('returns the raw input unchanged when it does not have 3 parts', () => {
      const service = new CryptoService();
      const notEncrypted = 'plaintext-without-dots';
      expect(service.decrypt(notEncrypted)).toBe(notEncrypted);
    });

    it('returns the raw input when only 1 part', () => {
      const service = new CryptoService();
      expect(service.decrypt('single')).toBe('single');
    });

    it('returns the raw input when 2 parts', () => {
      const service = new CryptoService();
      expect(service.decrypt('a.b')).toBe('a.b');
    });

    it('returns the raw input when 4 parts (malformed)', () => {
      const service = new CryptoService();
      expect(service.decrypt('a.b.c.d')).toBe('a.b.c.d');
    });
  });

  describe('isEncrypted()', () => {
    it('returns false for null', () => {
      const service = new CryptoService();
      expect(service.isEncrypted(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      const service = new CryptoService();
      expect(service.isEncrypted(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      const service = new CryptoService();
      expect(service.isEncrypted('')).toBe(false);
    });

    it('returns false for string without 3 dot-separated parts', () => {
      const service = new CryptoService();
      expect(service.isEncrypted('plaintext')).toBe(false);
    });

    it('returns false for string with 2 parts', () => {
      const service = new CryptoService();
      expect(service.isEncrypted('a.b')).toBe(false);
    });

    it('returns true for a value with 3 dot-separated parts', () => {
      const service = new CryptoService();
      const encrypted = service.encrypt('test-secret');
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('returns true for any string with exactly 3 dot-separated parts', () => {
      const service = new CryptoService();
      expect(service.isEncrypted('a.b.c')).toBe(true);
    });
  });
});
