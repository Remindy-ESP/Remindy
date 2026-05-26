import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';
import { GoogleOAuthService } from '../../infrastructure/services/google-oauth.service';
import { MicrosoftOAuthService } from '../../infrastructure/services/microsoft-oauth.service';
import { AppleOAuthService } from '../../infrastructure/services/apple-oauth.service';

export interface OAuthLoginParams {
  provider: 'google' | 'microsoft' | 'apple';
  token: string;
  appleEmail?: string;
  appleFirstName?: string;
  appleLastName?: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class OAuthLoginUseCase {
  /* istanbul ignore next */
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly eventEmitter: EventEmitter2,
    private readonly googleService: GoogleOAuthService,
    private readonly microsoftService: MicrosoftOAuthService,
    private readonly appleService: AppleOAuthService,
  ) {}

  async execute(params: OAuthLoginParams): Promise<LoginResponseDto> {
    const { providerId, email, firstName, lastName } = await this.verifyToken(params);

    // 1. Find by provider ID (repeat login)
    let user = await this.userRepo.findByOAuthId(params.provider, providerId);

    if (!user && email) {
      // 2. Find by email (first OAuth login — link the provider)
      user = await this.userRepo.findByEmail(email);
      if (user) {
        await this.userRepo.linkOAuthId(user.getId(), params.provider, providerId);
      }
    }

    if (!user) {
      // 3. Create new OAuth user
      if (!email) throw new UnauthorizedException('Email required for account creation');
      const oauthData: {
        email: string;
        firstName: string;
        lastName: string;
        googleId?: string;
        microsoftId?: string;
        appleId?: string;
      } = { email, firstName, lastName };
      if (params.provider === 'google') oauthData.googleId = providerId;
      else if (params.provider === 'microsoft') oauthData.microsoftId = providerId;
      else oauthData.appleId = providerId;
      const newUser = AuthUser.createFromOAuth(oauthData);
      user = await this.userRepo.save(newUser);
      this.eventEmitter.emit('auth.oauth.user.created', {
        userId: user.getId(),
        email,
        provider: params.provider,
      });
    }

    if (user.getStatus() === UserStatus.BANNED) {
      throw new UnauthorizedException('Account is banned');
    }

    await this.userRepo.updateLastLoginAt(user.getId(), new Date());

    const sessionId = randomUUID();
    const refreshToken = this.tokenService.generateRefreshToken({ sub: user.getId(), sessionId });
    const refreshTokenHash = await this.passwordService.hash(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.sessionRepo.createSession({
      id: sessionId,
      userId: user.getId(),
      refreshTokenHash,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceName: 'mobile',
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

    this.eventEmitter.emit('security.login.success', {
      userId: user.getId(),
      userEmail: email ?? 'oauth-user',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return { accessToken, refreshToken, userId: user.getId() };
  }

  private async verifyToken(params: OAuthLoginParams): Promise<{
    providerId: string;
    email: string | null;
    firstName: string;
    lastName: string;
  }> {
    if (params.provider === 'google') {
      const info = await this.googleService.verifyIdToken(params.token);
      return {
        providerId: info.providerId,
        email: info.email,
        firstName: info.firstName,
        lastName: info.lastName,
      };
    }
    if (params.provider === 'microsoft') {
      const info = await this.microsoftService.verifyAccessToken(params.token);
      return {
        providerId: info.providerId,
        email: info.email,
        firstName: info.firstName,
        lastName: info.lastName,
      };
    }
    // apple
    const info = await this.appleService.verifyIdentityToken(params.token);
    return {
      providerId: info.providerId,
      email: params.appleEmail ?? info.email,
      firstName: params.appleFirstName ?? '',
      lastName: params.appleLastName ?? '',
    };
  }
}
