import { Injectable, Logger } from '@nestjs/common';
import SendGrid from '@sendgrid/mail';
import { IEmailService } from './email.service';

@Injectable()
export class SendgridEmailService implements IEmailService {
  private readonly logger = new Logger(SendgridEmailService.name);

  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is missing');
    }

    SendGrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void> {
    const { to, resetLink } = params;

    try {
      await SendGrid.send({
        to,
        from: process.env.MAIL_FROM!,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <p>Bonjour,</p>

          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

          <p>
            <a href="${resetLink}">
              Réinitialiser mon mot de passe
            </a>
          </p>

          <p>Ce lien expire dans 15 minutes.</p>

          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error?.response?.body || error,
      );

      throw error;
    }
  }
}
