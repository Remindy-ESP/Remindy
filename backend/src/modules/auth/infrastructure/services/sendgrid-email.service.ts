import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IEmailService } from './email.service';

@Injectable()
export class BrevoEmailService implements IEmailService {
  private readonly logger = new Logger(BrevoEmailService.name);

  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  async sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void> {
    const { to, resetLink } = params;

    try {
      await axios.post(
        this.apiUrl,
        {
          sender: {
            email: process.env.MAIL_FROM,
            name: 'Remindy',
          },
          to: [{ email: to }],
          subject: 'Réinitialisation de votre mot de passe',
          htmlContent: `
            <p>Bonjour,</p>

            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

            <p>
              <a href="${resetLink}">
                Réinitialiser mon mot de passe
              </a>
            </p>

            <p>Ce lien expire dans 15 minutes.</p>
          `,
        },
        {
          headers: {
            'api-key': process.env.SENDGRID_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error?.response?.data || error,
      );
      throw error;
    }
  }
}
