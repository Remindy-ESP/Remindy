import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SendgridEmailService } from './sendgrid-email.service';
import SendGrid from '@sendgrid/mail';

jest.mock('@sendgrid/mail');

describe('SendgridEmailService', () => {
  let service: SendgridEmailService;
  let loggerErrorSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };

    // Mock SendGrid methods
    (SendGrid.setApiKey as jest.Mock) = jest.fn();
    (SendGrid.send as jest.Mock) = jest.fn();

    // Spy on logger
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    loggerErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should successfully initialize with valid SENDGRID_API_KEY', () => {
      process.env.SENDGRID_API_KEY = 'test-api-key';
      process.env.MAIL_FROM = 'test@example.com';

      expect(() => {
        service = new SendgridEmailService();
      }).not.toThrow();

      expect(SendGrid.setApiKey).toHaveBeenCalledWith('test-api-key');
    });

    it('should throw error when SENDGRID_API_KEY is missing', () => {
      delete process.env.SENDGRID_API_KEY;

      expect(() => {
        service = new SendgridEmailService();
      }).toThrow('SENDGRID_API_KEY is missing');

      expect(SendGrid.setApiKey).not.toHaveBeenCalled();
    });

    it('should throw error when SENDGRID_API_KEY is empty string', () => {
      process.env.SENDGRID_API_KEY = '';

      expect(() => {
        service = new SendgridEmailService();
      }).toThrow('SENDGRID_API_KEY is missing');

      expect(SendGrid.setApiKey).not.toHaveBeenCalled();
    });

    it('should throw error when SENDGRID_API_KEY is undefined', () => {
      process.env.SENDGRID_API_KEY = undefined;

      expect(() => {
        service = new SendgridEmailService();
      }).toThrow('SENDGRID_API_KEY is missing');
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
      process.env.SENDGRID_API_KEY = 'test-api-key';
      process.env.MAIL_FROM = 'noreply@example.com';
      service = new SendgridEmailService();
    });

    it('should send password reset email with correct parameters', async () => {
      const params = {
        to: 'user@example.com',
        resetLink: 'https://example.com/reset-password?token=abc123',
      };

      (SendGrid.send as jest.Mock).mockResolvedValue([{ statusCode: 202 }]);

      await service.sendPasswordResetEmail(params);

      expect(SendGrid.send).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'noreply@example.com',
        subject: 'Réinitialisation de votre mot de passe',
        html: expect.stringContaining('https://example.com/reset-password?token=abc123'),
      });

      expect(SendGrid.send).toHaveBeenCalledTimes(1);
    });

    it('should include reset link in HTML content', async () => {
      const params = {
        to: 'test@example.com',
        resetLink: 'https://app.example.com/reset?token=xyz789',
      };

      (SendGrid.send as jest.Mock).mockResolvedValue([{ statusCode: 202 }]);

      await service.sendPasswordResetEmail(params);

      const callArgs = (SendGrid.send as jest.Mock).mock.calls[0][0];
      expect(callArgs.html).toContain('https://app.example.com/reset?token=xyz789');
      expect(callArgs.html).toContain('Réinitialiser mon mot de passe');
      expect(callArgs.html).toContain('Ce lien expire dans 30 minutes');
    });

    it('should handle SendGrid API error with response body', async () => {
      const params = {
        to: 'user@example.com',
        resetLink: 'https://example.com/reset',
      };

      const sendGridError: any = new Error('Bad Request');
      sendGridError.code = 400;
      sendGridError.response = {
        body: {
          errors: [
            {
              message: 'Invalid email address',
              field: 'to',
            },
          ],
        },
      };

      (SendGrid.send as jest.Mock).mockRejectedValue(sendGridError);

      await expect(service.sendPasswordResetEmail(params)).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to user@example.com',
        sendGridError.response.body,
      );
    });

    it('should handle SendGrid API error without response body', async () => {
      const params = {
        to: 'user@example.com',
        resetLink: 'https://example.com/reset',
      };

      const sendGridError = new Error('Network error');

      (SendGrid.send as jest.Mock).mockRejectedValue(sendGridError);

      await expect(service.sendPasswordResetEmail(params)).rejects.toThrow('Network error');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to user@example.com',
        sendGridError,
      );
    });

    it('should handle error with null response', async () => {
      const params = {
        to: 'test@example.com',
        resetLink: 'https://example.com/reset',
      };

      const error: any = new Error('API Error');
      error.response = null;

      (SendGrid.send as jest.Mock).mockRejectedValue(error);

      await expect(service.sendPasswordResetEmail(params)).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to test@example.com',
        error,
      );
    });

    it('should handle error with undefined response', async () => {
      const params = {
        to: 'another@example.com',
        resetLink: 'https://example.com/reset',
      };

      const error: any = new Error('Unknown error');
      error.response = undefined;

      (SendGrid.send as jest.Mock).mockRejectedValue(error);

      await expect(service.sendPasswordResetEmail(params)).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to another@example.com',
        error,
      );
    });

    it('should rethrow error after logging', async () => {
      const params = {
        to: 'user@example.com',
        resetLink: 'https://example.com/reset',
      };

      const customError = new Error('SendGrid service unavailable');
      (SendGrid.send as jest.Mock).mockRejectedValue(customError);

      await expect(service.sendPasswordResetEmail(params)).rejects.toThrow(
        'SendGrid service unavailable',
      );

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should send email with correct French content', async () => {
      const params = {
        to: 'francais@example.com',
        resetLink: 'https://example.fr/reset',
      };

      (SendGrid.send as jest.Mock).mockResolvedValue([{ statusCode: 202 }]);

      await service.sendPasswordResetEmail(params);

      const callArgs = (SendGrid.send as jest.Mock).mock.calls[0][0];
      expect(callArgs.subject).toBe('Réinitialisation de votre mot de passe');
      expect(callArgs.html).toContain('Bonjour,');
      expect(callArgs.html).toContain('Vous avez demandé la réinitialisation de votre mot de passe.');
      expect(callArgs.html).toContain("Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.");
    });

    it('should use MAIL_FROM environment variable as sender', async () => {
      process.env.MAIL_FROM = 'custom-sender@myapp.com';
      service = new SendgridEmailService();

      const params = {
        to: 'recipient@example.com',
        resetLink: 'https://example.com/reset',
      };

      (SendGrid.send as jest.Mock).mockResolvedValue([{ statusCode: 202 }]);

      await service.sendPasswordResetEmail(params);

      expect(SendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom-sender@myapp.com',
        }),
      );
    });
  });
});
