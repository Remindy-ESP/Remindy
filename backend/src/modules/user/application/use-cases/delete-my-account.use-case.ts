import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user-user.repository';
import { AbstractUserSessionRepository } from '../../domain/repositories/user-session-repository';

@Injectable()
export class DeleteMyAccountUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: AbstractUserSessionRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('DeleteMyAccountUseCase called without userId');
    }

    await this.sessionRepo.revokeAllForUser(userId);

    await this.userRepo.softDelete(userId);
  }
}
