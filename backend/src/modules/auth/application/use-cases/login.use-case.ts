import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(params: {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
    deviceName?: string;
  }): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByEmail(params.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(
      params.password,
      user.getPasswordHash(),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = randomUUID();

    const refreshToken = this.tokenService.generateRefreshToken({
      sub: user.getId(),
      sessionId,
    });

    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.sessionRepo.createSession({
      id: sessionId,
      userId: user.getId(),
      refreshTokenHash,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceName: params.deviceName ?? 'web',
      expiresAt,
      lastActivity: new Date(),
      isRevoked: false,
    });

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.getId(),
      role: user.getRoleKey(),
      mfaEnabled: user.isMfaEnabled(),
      mfaVerified: false,
    });

    return {
      accessToken,
      refreshToken,
      userId: user.getId(),
    };
  }
}
