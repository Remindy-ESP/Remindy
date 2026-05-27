import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';

@Injectable()
export class LogoutUseCase {
  /* istanbul ignore next */
  constructor(
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload?.sessionId) return;

    const session = await this.sessionRepo.findActiveSessionById(payload.sessionId);
    if (!session) return;

    const isValid = await this.passwordService.compare(refreshToken, session.refreshTokenHash);
    if (!isValid) return;

    await this.sessionRepo.revokeSession(session.id);

    this.eventEmitter.emit('security.logout', {
      userId: session.userId,
    });
  }
}
