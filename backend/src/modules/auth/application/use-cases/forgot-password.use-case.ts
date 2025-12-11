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

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail({
      to: user.getEmail(),
      resetLink,
    });
  }
}
