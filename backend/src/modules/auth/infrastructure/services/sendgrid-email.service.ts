import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IEmailService, MonthlyReportData, NotificationEmailData } from './email.service';

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

  async sendMonthlyReport(params: { to: string; data: MonthlyReportData }): Promise<void> {
    const { to, data } = params;

    let trendIcon = '→';
    if (data.trend === 'up') trendIcon = '↑';
    else if (data.trend === 'down') trendIcon = '↓';

    let trendText = 'stable par rapport au mois précédent';
    if (data.trend !== 'stable') {
      const direction = data.trend === 'up' ? 'de plus' : 'de moins';
      trendText = `${Math.abs(data.percentageChange)}% ${direction} que le mois précédent`;
    }

    const categoryRows = data.categorySummary
      .map(
        c =>
          `<tr><td style="padding:4px 8px">${c.name}</td><td style="padding:4px 8px;text-align:right">${c.total.toFixed(2)} ${data.currency}</td></tr>`,
      )
      .join('');

    const topCategoryHtml = data.topCategory
      ? `<p><strong>Top catégorie :</strong> ${data.topCategory.name} — ${data.topCategory.total.toFixed(2)} ${data.currency}</p>`
      : '';

    const html = `
      <h2>Récapitulatif mensuel — ${data.month}</h2>
      <p>Bonjour ${data.userName},</p>
      <p>Voici votre résumé de dépenses pour le mois de <strong>${data.month}</strong>.</p>
      <h3>Total : ${data.totalExpenses.toFixed(2)} ${data.currency} ${trendIcon}</h3>
      <p>${trendText}</p>
      ${topCategoryHtml}
      <h3>Détail par catégorie</h3>
      <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr><th style="padding:4px 8px">Catégorie</th><th style="padding:4px 8px">Montant</th></tr>
        ${categoryRows || '<tr><td colspan="2" style="padding:4px 8px">Aucune dépense ce mois-ci</td></tr>'}
      </table>
      <p><strong>Abonnements actifs :</strong> ${data.activeSubscriptionsCount}</p>
      <p style="color:#888;font-size:12px">Vous recevez cet email car le résumé mensuel est activé dans vos préférences Remindy.</p>
    `;

    try {
      await this.createTransporter().sendMail({
        from: `Remindy <${process.env.MAIL_USER}>`,
        to,
        subject: `Récapitulatif mensuel — ${data.month}`,
        html,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send monthly report to ${to}`, error);
      throw error;
    }
  }

  async sendNotificationEmail(params: { to: string; data: NotificationEmailData }): Promise<void> {
    const { to, data } = params;

    const isRenewal = data.type === 'subscription_renewal';
    const accentColor = isRenewal ? '#22c55e' : '#f97316';
    const emoji = isRenewal ? '🔄' : '⏳';
    const subject = `${emoji} ${data.title}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <div style="background:${accentColor};color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;font-size:18px;">${emoji} ${data.title}</h2>
        </div>
        <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
          <p style="margin:0 0 12px;font-size:15px;color:#374151;">${data.body}</p>
          <p style="margin:0;font-size:13px;color:#9ca3af;">— Remindy</p>
        </div>
      </div>
    `;

    try {
      await this.createTransporter().sendMail({
        from: `Remindy <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Notification email sent to ${to} (${data.type})`);
    } catch (error: any) {
      this.logger.error(`Failed to send notification email to ${to}: ${error.message}`);
      throw error;
    }
  }
}
