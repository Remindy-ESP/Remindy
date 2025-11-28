import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ITokenService } from '../../domain/services/token.service';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(params: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {

    const payload = this.tokenService.verifyRefreshToken(
      params.refreshToken,
    );

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;

    const session = await this.sessionRepo.findActiveSessionById(
      payload.sessionId!,
    );

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const isValid = await this.passwordService.compare(
      params.refreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.tokenService.generateAccessToken({
      sub: userId,
    });

    const newRefreshToken = this.tokenService.generateRefreshToken({
      sub: userId,
      sessionId: session.id,
    });

    const newRefreshTokenHash =
      await this.passwordService.hash(newRefreshToken);

    await this.sessionRepo.updateRefreshToken(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      lastActivity: new Date(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

