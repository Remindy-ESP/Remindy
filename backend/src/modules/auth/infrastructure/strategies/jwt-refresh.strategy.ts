import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayload } from '../../domain/services/token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const token = req.cookies?.refreshToken;
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!,
    });
  }

  validate(payload: JwtRefreshPayload): {
    userId: string;
    sessionId: string;
  } {
    if (!payload?.sub || !payload?.sessionId) {
      throw new UnauthorizedException('Refresh token payload missing required claims');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
    };
  }
}
