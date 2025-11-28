export abstract class IUserSessionRepository {

  abstract createSession(params: {
    userId: string;
    refreshTokenHash: string;
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    expiresAt: Date;
  }): Promise<{ id: string }>;

  abstract findActiveSessionById(sessionId: string): Promise<{
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
  } | null>;

  abstract updateRefreshToken(
    sessionId: string,
    params: {
      refreshTokenHash: string;
      lastActivity: Date;
    },
  ): Promise<void>;

  abstract findActiveByRefreshTokenHash(
    hash: string,
  ): Promise<{ id: string } | null>;

  abstract revokeSession(sessionId: string): Promise<void>;
}
