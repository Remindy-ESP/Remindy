import axios from 'axios';
import { Logger } from '@nestjs/common';
import { ResendEmailService } from './sendgrid-email.service';

jest.mock('axios');

describe('ResendEmailService', () => {
  let service: ResendEmailService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const envBackup = { ...process.env };

  beforeEach(() => {
    service = new ResendEmailService();
    process.env.MAIL_FROM = 'Remindy <noreply@example.com>';
    process.env.RESEND_API_KEY = 'resend-api-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    process.env = { ...envBackup };
  });

  it('sends the password reset email with the expected Resend payload', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} } as any);

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'https://example.com/reset?token=abc',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        from: 'Remindy <noreply@example.com>',
        to: ['user@example.com'],
        subject: 'Réinitialisation de votre mot de passe',
        html: expect.stringContaining('https://example.com/reset?token=abc'),
      }),
      {
        headers: {
          Authorization: 'Bearer resend-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('falls back to onboarding@resend.dev when MAIL_FROM is not set', async () => {
    delete process.env.MAIL_FROM;
    mockedAxios.post.mockResolvedValue({ data: {} } as any);

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'https://example.com/reset?token=abc',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ from: 'Remindy <onboarding@resend.dev>' }),
      expect.anything(),
    );
  });

  it('logs the Resend response data and rethrows the error when the request fails', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = {
      response: { data: { message: 'Resend failure' } },
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
      { message: 'Resend failure' },
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
