import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IEmailService } from './email.service';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  private readonly apiUrl = 'https://api.resend.com/emails';

  async sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void> {
    const { to, resetLink } = params;

    try {
      await axios.post(
        this.apiUrl,
        {
          from: process.env.MAIL_FROM ?? 'Remindy <onboarding@resend.dev>',
          to: [to],
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
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
