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

  it('logs the error and rethrows when sending password reset email fails', async () => {
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
  it('sends the verification email via Gmail SMTP', async () => {
    await service.sendVerificationEmail({
      to: 'user@example.com',
      verificationLink: 'http://localhost:3000/verify-email?token=xyz',
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
        subject: 'Confirmez votre adresse email',
        html: expect.stringContaining('http://localhost:3000/verify-email?token=xyz'),
      }),
    );
  });

  it('logs the error and rethrows when sending verification email fails', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('SMTP connection refused');
    sendMailMock.mockRejectedValue(error);

    await expect(
      service.sendVerificationEmail({
        to: 'user@example.com',
        verificationLink: 'http://localhost:3000/verify-email?token=xyz',
      }),
    ).rejects.toBe(error);

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send verification email to user@example.com',
      error,
    );
  });

  it('sends the monthly report email via Gmail SMTP', async () => {
    await service.sendMonthlyReport({
      to: 'user@example.com',
      data: {
        userName: 'John',
        month: 'avril 2026',
        totalExpenses: 55.97,
        previousTotalExpenses: 45.98,
        percentageChange: 21.7,
        trend: 'up',
        categorySummary: [
          { name: 'Streaming', total: 25.98 },
          { name: 'Sport', total: 30 },
        ],
        topCategory: { name: 'Sport', total: 30 },
        activeSubscriptionsCount: 3,
        currency: 'EUR',
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Remindy <remindy@gmail.com>',
        to: 'user@example.com',
        subject: 'Récapitulatif mensuel — avril 2026',
        html: expect.stringContaining('55.97'),
      }),
    );
  });

  it('sends the monthly report email with trend down', async () => {
    await service.sendMonthlyReport({
      to: 'user@example.com',
      data: {
        userName: 'Alice',
        month: 'mars 2026',
        totalExpenses: 30,
        previousTotalExpenses: 50,
        percentageChange: -40,
        trend: 'down',
        categorySummary: [{ name: 'Streaming', total: 30 }],
        topCategory: { name: 'Streaming', total: 30 },
        activeSubscriptionsCount: 2,
        currency: 'EUR',
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        html: expect.stringContaining('de moins'),
      }),
    );
  });

  it('logs the error and rethrows when sending monthly report fails', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('SMTP timeout');
    sendMailMock.mockRejectedValue(error);

    await expect(
      service.sendMonthlyReport({
        to: 'user@example.com',
        data: {
          userName: 'John',
          month: 'avril 2026',
          totalExpenses: 0,
          previousTotalExpenses: 0,
          percentageChange: 0,
          trend: 'stable',
          categorySummary: [],
          topCategory: null,
          activeSubscriptionsCount: 0,
          currency: 'EUR',
        },
      }),
    ).rejects.toBe(error);

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send monthly report to user@example.com',
      error,
    );
  });

  it('sends a renewal notification email', async () => {
    await service.sendNotificationEmail({
      to: 'user@example.com',
      data: {
        title: 'Renouvellement',
        body: 'Netflix — renouvellement dans 3 jour(s)',
        subscriptionName: 'Netflix',
        type: 'subscription_renewal',
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Remindy <remindy@gmail.com>',
        to: 'user@example.com',
        subject: expect.stringContaining('Renouvellement'),
        html: expect.stringContaining('Netflix'),
      }),
    );
  });

  it('sends a trial ending notification email', async () => {
    await service.sendNotificationEmail({
      to: 'user@example.com',
      data: {
        title: "Période d'essai",
        body: 'Spotify — essai gratuit se termine dans 3 jour(s)',
        subscriptionName: 'Spotify',
        type: 'trial_ending',
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining("Période d'essai"),
        html: expect.stringContaining('Spotify'),
      }),
    );
  });

  it('logs the error and rethrows when sending notification email fails', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('SMTP timeout');
    sendMailMock.mockRejectedValue(error);

    await expect(
      service.sendNotificationEmail({
        to: 'user@example.com',
        data: {
          title: 'Renouvellement',
          body: 'Netflix — renouvellement dans 3 jour(s)',
          subscriptionName: 'Netflix',
          type: 'subscription_renewal',
        },
      }),
    ).rejects.toBe(error);

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send notification email to user@example.com'),
    );
  });
});
