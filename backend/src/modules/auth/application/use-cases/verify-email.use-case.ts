import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly userRepo: IUserAuthRepository) {}

  async execute(token: string): Promise<void> {
    const secret = process.env.JWT_EMAIL_VERIFICATION_SECRET;

    if (!secret) {
      throw new Error('JWT_EMAIL_VERIFICATION_SECRET is not configured');
    }

    let verified: string | jwt.JwtPayload;

    try {
      verified = jwt.verify(token, secret);
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

    if (user.isEmailVerified()) {
      return;
    }

    await this.userRepo.markEmailAsVerified(user.getId());
  }
}
