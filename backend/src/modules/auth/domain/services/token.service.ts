import { Role } from '../value-objects/role.enum';

export interface JwtAccessPayload {
  sub: string;
  role: Role;
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
}

export abstract class ITokenService {
  abstract generateAccessToken(payload: JwtAccessPayload): string;

  abstract generateRefreshToken(payload: JwtRefreshPayload): string;

  abstract verifyAccessToken(token: string): JwtAccessPayload;

  abstract verifyRefreshToken(token: string): JwtRefreshPayload;

  abstract generatePasswordResetToken(payload: { sub: string }): string;
}
