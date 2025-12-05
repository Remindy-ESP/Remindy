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
    let verified: string | jwt.JwtPayload;

    try {
      verified = jwt.verify(params.token, process.env.JWT_PASSWORD_RESET_SECRET!);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (typeof verified === 'string' || !verified.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userRepo.findById(verified.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordHash = await this.passwordService.hash(params.newPassword);
    await this.userRepo.updatePassword(user.getId(), passwordHash);
  }
}
