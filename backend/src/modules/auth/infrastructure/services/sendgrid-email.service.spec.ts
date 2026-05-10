import axios from 'axios';
import { Logger } from '@nestjs/common';
import { BrevoEmailService } from './sendgrid-email.service';

jest.mock('axios');

describe('BrevoEmailService', () => {
  let service: BrevoEmailService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const envBackup = { ...process.env };

  beforeEach(() => {
    service = new BrevoEmailService();
    process.env.MAIL_FROM = 'noreply@example.com';
    process.env.SENDGRID_API_KEY = 'brevo-api-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    process.env = { ...envBackup };
  });

  it('sends the password reset email with the expected Brevo payload', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} } as any);

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'https://example.com/reset?token=abc',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        sender: {
          email: 'noreply@example.com',
          name: 'Remindy',
        },
        to: [{ email: 'user@example.com' }],
        subject: 'Réinitialisation de votre mot de passe',
        htmlContent: expect.stringContaining('https://example.com/reset?token=abc'),
      }),
      {
        headers: {
          'api-key': 'brevo-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('logs Brevo response data and rethrows the error when the request fails', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = {
      response: { data: { message: 'Brevo failure' } },
    };

    mockedAxios.post.mockRejectedValue(error as any);

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetLink: 'https://example.com/reset?token=abc',
      }),
    ).rejects.toBe(error);

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send password reset email to user@example.com',
      { message: 'Brevo failure' },
    );
  });

  it('logs the raw error when no response payload is available', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('network down');

    mockedAxios.post.mockRejectedValue(error);

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetLink: 'https://example.com/reset?token=abc',
      }),
    ).rejects.toBe(error);

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send password reset email to user@example.com',
      error,
    );
  });
});
