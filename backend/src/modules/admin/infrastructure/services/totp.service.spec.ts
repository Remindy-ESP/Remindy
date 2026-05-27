import { TotpService } from './totp.service';
import { authenticator } from 'otplib';

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(() => {
    service = new TotpService();
  });

  describe('constructor', () => {
    it('sets authenticator window to 1', () => {
      expect(authenticator.options).toMatchObject({ window: 1 });
    });
  });

  describe('generateSecret()', () => {
    it('returns a non-empty string', () => {
      const secret = service.generateSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('returns different secrets on each call', () => {
      const a = service.generateSecret();
      const b = service.generateSecret();
      expect(a).not.toBe(b);
    });
  });

  describe('buildOtpAuthUrl()', () => {
    it('returns a valid otpauth:// URL', () => {
      const secret = service.generateSecret();
      const url = service.buildOtpAuthUrl('user@example.com', 'Remindy', secret);
      expect(url).toMatch(/^otpauth:\/\/totp\//);
    });

    it('includes the email, issuer, and secret in the URL', () => {
      const secret = service.generateSecret();
      const url = service.buildOtpAuthUrl('test@test.com', 'MyApp', secret);
      expect(url).toContain('MyApp');
      expect(url).toContain(encodeURIComponent('test@test.com'));
      expect(url).toContain(`secret=${secret}`);
    });
  });

  describe('verify()', () => {
    it('returns true for a valid TOTP code', () => {
      const secret = service.generateSecret();
      const validCode = authenticator.generate(secret);
      expect(service.verify(validCode, secret)).toBe(true);
    });

    it('returns false for an invalid TOTP code', () => {
      const secret = service.generateSecret();
      expect(service.verify('000000', secret)).toBe(false);
    });

    it('returns false for a wrong secret', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();
      const code = authenticator.generate(secret1);
      expect(service.verify(code, secret2)).toBe(false);
    });
  });
});
