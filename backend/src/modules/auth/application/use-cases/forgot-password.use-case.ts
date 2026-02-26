import { Injectable } from '@nestjs/common';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { ITokenService } from '../../domain/services/token.service';
import { IEmailService } from '../../infrastructure/services/email.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      return;
    }

    const token = this.tokenService.generatePasswordResetToken({
      sub: user.getId(),
    });

    const resetLink = this.buildResetLink(token);

    await this.emailService.sendPasswordResetEmail({
      to: user.getEmail(),
      resetLink,
    });
  }

  private buildResetLink(token: string): string {
    const explicitResetUrl = process.env.FRONTEND_PASSWORD_RESET_URL?.trim();

    if (explicitResetUrl) {
      return this.appendToken(explicitResetUrl, token);
    }

    const frontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:3000';
    return this.appendToken(`${frontendUrl}/reset-password`, token);
  }

  private appendToken(baseUrl: string, token: string): string {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${token}`;
  }
}
