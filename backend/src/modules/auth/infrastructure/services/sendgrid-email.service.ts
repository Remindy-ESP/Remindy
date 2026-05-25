import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IEmailService } from './email.service';

@Injectable()
export class GmailEmailService implements IEmailService {
  private readonly logger = new Logger(GmailEmailService.name);

  private createTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_APP_PASSWORD,
      },
    } as SMTPTransport.Options);
  }

  async sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void> {
    const { to, resetLink } = params;

    try {
      await this.createTransporter().sendMail({
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

  async sendVerificationEmail(params: { to: string; verificationLink: string }): Promise<void> {
    const { to, verificationLink } = params;

    try {
      await this.createTransporter().sendMail({
        from: `Remindy <${process.env.MAIL_USER}>`,
        to,
        subject: 'Confirmez votre adresse email',
        html: `
          <p>Bonjour,</p>
          <p>Merci de vous être inscrit sur Remindy.</p>
          <p>
            <a href="${verificationLink}">Confirmer mon adresse email</a>
          </p>
          <p>Ce lien expire dans 24 heures.</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
      throw error;
    }
  }
}
