export abstract class IUserSessionRepository {
  abstract createSession(params: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    expiresAt: Date;
    lastActivity: Date;
    isRevoked?: boolean;
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

  abstract findActiveByRefreshTokenHash(hash: string): Promise<{ id: string } | null>;

  abstract revokeSession(sessionId: string): Promise<void>;

  abstract revokeAllForUser(userId: string): Promise<void>;
}
