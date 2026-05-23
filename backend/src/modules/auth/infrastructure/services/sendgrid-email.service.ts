import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailService } from './email.service';

@Injectable()
export class GmailEmailService implements IEmailService {
  private readonly logger = new Logger(GmailEmailService.name);

  async sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void> {
    const { to, resetLink } = params;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_APP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: `Remindy <${process.env.MAIL_USER}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>
            <a href="${resetLink}">Réinitialiser mon mot de passe</a>
          </p>
          <p>Ce lien expire dans 15 minutes.</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}
