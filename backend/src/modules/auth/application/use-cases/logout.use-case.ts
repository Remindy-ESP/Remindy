import { Injectable } from '@nestjs/common';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    const session =
      await this.sessionRepo.findActiveByRefreshTokenHash(refreshTokenHash);

    if (!session) {
      return;
    }

    await this.sessionRepo.revokeSession(session.id);
  }
}
