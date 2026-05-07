/* istanbul ignore file */
export abstract class IUserSessionRepository {
  abstract createSession(params: {
    userId: string;
    refreshTokenHash: string;
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    expiresAt: Date;
  }): Promise<{ id: string }>;
}
