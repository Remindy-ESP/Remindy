import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtAccessTokenPayload {
  sub?: string;
  role?: string;
  mfaEnabled?: boolean;
  mfaVerified?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /* istanbul ignore next */
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET')!,
    });
  }

  validate(payload: JwtAccessTokenPayload) {
    if (!payload?.sub || !payload?.role) {
      throw new UnauthorizedException('Token payload missing required claims');
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      role: payload.role,
      mfaEnabled: !!payload.mfaEnabled,
      mfaVerified: !!payload.mfaVerified,
    };
  }
}
