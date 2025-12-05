import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IPasswordService } from '../../domain/services/password.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(params: { token: string; newPassword: string }): Promise<void> {
    interface PasswordResetJwtPayload {
      sub: string;
    }

    let payload: PasswordResetJwtPayload;

    try {
      payload = jwt.verify(
        params.token,
        process.env.JWT_PASSWORD_RESET_SECRET!,
      ) as PasswordResetJwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userRepo.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordHash = await this.passwordService.hash(params.newPassword);
    await this.userRepo.updatePassword(user.getId(), passwordHash);
  }
}
