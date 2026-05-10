import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /* istanbul ignore next */
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET')!,
    });
  }

  validate(payload: any) {
    return {
      id: payload.sub,
      userId: payload.sub,
      role: payload.role,
      mfaEnabled: !!payload.mfaEnabled,
      mfaVerified: !!payload.mfaVerified,
    };
  }
}
