import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';
import { GmailEmailService } from './sendgrid-email.service';

jest.mock('nodemailer');

describe('GmailEmailService', () => {
  let service: GmailEmailService;
  const sendMailMock = jest.fn();
  const envBackup = { ...process.env };

  beforeEach(() => {
    service = new GmailEmailService();
    process.env.MAIL_USER = 'remindy@gmail.com';
    process.env.MAIL_APP_PASSWORD = 'test-app-password';
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
    sendMailMock.mockResolvedValue({ messageId: 'test-id' });
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
  });

  it('sends the password reset email via Gmail SMTP', async () => {
    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'frontendmobile://reset-password?token=abc',
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'remindy@gmail.com', pass: 'test-app-password' },
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Remindy <remindy@gmail.com>',
        to: 'user@example.com',
        subject: 'Réinitialisation de votre mot de passe',
        html: expect.stringContaining('frontendmobile://reset-password?token=abc'),
      }),
    );
  });

  it('logs the error and rethrows when sending fails', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('SMTP connection refused');
    sendMailMock.mockRejectedValue(error);

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetLink: 'frontendmobile://reset-password?token=abc',
      }),
    ).rejects.toBe(error);

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send password reset email to user@example.com',
      error,
    );
  });
});
