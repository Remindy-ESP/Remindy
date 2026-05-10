import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';

const BRUTE_FORCE_THRESHOLD = 5;

@Injectable()
export class LoginUseCase {
  /* istanbul ignore next */
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly eventEmitter: EventEmitter2,
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
      this.eventEmitter.emit('security.login.failure', {
        userEmail: params.email,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Block locked accounts before checking the password (avoids extra DB writes)
    if (user.getFailedLoginCount() >= BRUTE_FORCE_THRESHOLD) {
      this.eventEmitter.emit('security.login.brute_force', {
        userEmail: params.email,
        ipAddress: params.ipAddress,
        metadata: { attempts: user.getFailedLoginCount() },
      });
      throw new UnauthorizedException('Account temporarily locked due to too many failed attempts');
    }

    // Reject suspended or soft-deleted accounts
    if (user.getStatus() !== UserStatus.ACTIVE) {
      this.eventEmitter.emit('security.login.failure', {
        userEmail: params.email,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: { reason: 'account_inactive', status: user.getStatus() },
      });
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await this.passwordService.compare(
      params.password,
      user.getPasswordHash(),
    );

    if (!isPasswordValid) {
      await this.userRepo.incrementFailedLoginCount(user.getId());
      const newFailedCount = user.getFailedLoginCount() + 1;

      if (newFailedCount >= BRUTE_FORCE_THRESHOLD) {
        this.eventEmitter.emit('security.login.brute_force', {
          userEmail: params.email,
          ipAddress: params.ipAddress,
          metadata: { attempts: newFailedCount },
        });
      } else {
        this.eventEmitter.emit('security.login.failure', {
          userEmail: params.email,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: { reason: 'invalid_password', attempts: newFailedCount },
        });
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepo.resetFailedLoginCount(user.getId());
    await this.userRepo.updateLastLoginAt(user.getId(), new Date());

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

    this.eventEmitter.emit('security.login.success', {
      userId: user.getId(),
      userEmail: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      userId: user.getId(),
    };
  }
}
