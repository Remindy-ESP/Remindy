import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtAccessPayload, JwtRefreshPayload } from '../../domain/services/token.service';

@Injectable()
export class JwtTokenService {
  /* istanbul ignore next */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generatePasswordResetToken(payload: { sub: string }): string {
    return this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.configService.get<string>('JWT_PASSWORD_RESET_SECRET')!,
        expiresIn: '15m',
      },
    );
  }

  generateEmailVerificationToken(payload: { sub: string }): string {
    return this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET')!,
        expiresIn: '24h',
      },
    );
  }

  generateAccessToken(payload: JwtAccessPayload): string {
    const options: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET')!,
      expiresIn: this.configService.get<StringValue>('JWT_ACCESS_TOKEN_EXPIRATION')!,
    };
    return this.jwtService.sign(payload, options);
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    return this.jwtService.verify<JwtAccessPayload>(token, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET')!,
    });
  }

  generateRefreshToken(payload: JwtRefreshPayload): string {
    const options: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!,
      expiresIn: this.configService.get<StringValue>('JWT_REFRESH_TOKEN_EXPIRATION')!,
    };
    return this.jwtService.sign(payload, options);
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    return this.jwtService.verify<JwtRefreshPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!,
    });
  }
}
