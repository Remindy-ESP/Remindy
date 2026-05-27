import { Injectable } from '@nestjs/common';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { ITokenService } from '../../domain/services/token.service';
import { IEmailService } from '../../infrastructure/services/email.service';

@Injectable()
export class SendVerificationEmailUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      return;
    }

    if (user.isEmailVerified()) {
      return;
    }

    const token = this.tokenService.generateEmailVerificationToken({
      sub: user.getId(),
    });

    const verificationLink = this.buildVerificationLink(token);

    await this.emailService.sendVerificationEmail({
      to: user.getEmail(),
      verificationLink,
    });
  }

  private buildVerificationLink(token: string): string {
    const explicitVerifyUrl = process.env.FRONTEND_EMAIL_VERIFY_URL?.trim();

    if (explicitVerifyUrl) {
      return this.appendToken(explicitVerifyUrl, token);
    }

    const frontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:3000';
    return this.appendToken(`${frontendUrl}/verify-email`, token);
  }

  private appendToken(baseUrl: string, token: string): string {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${token}`;
  }
}
