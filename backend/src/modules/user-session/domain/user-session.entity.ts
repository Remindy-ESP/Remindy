/**
 * UserSession Domain Entity
 */
export class UserSession {
  private id: string;
  private userId: string;
  private refreshTokenHash: string;
  private deviceName: string | null;
  private ipAddress: string;
  private userAgent: string | null;
  private lastActivity: Date;
  private expiresAt: Date;
  private isRevoked: boolean;
  private createdAt: Date;
  private deletedAt: Date | null;

  constructor(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    deviceName?: string | null;
    ipAddress: string;
    userAgent?: string | null;
    lastActivity?: Date;
    expiresAt: Date;
    isRevoked?: boolean;
    createdAt?: Date;
    deletedAt?: Date | null;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.refreshTokenHash = props.refreshTokenHash;
    this.deviceName = props.deviceName ?? null;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent ?? null;
    this.lastActivity = props.lastActivity ?? new Date();
    this.expiresAt = props.expiresAt;
    this.isRevoked = props.isRevoked ?? false;
    this.createdAt = props.createdAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getRefreshTokenHash(): string {
    return this.refreshTokenHash;
  }

  getDeviceName(): string | null {
    return this.deviceName;
  }

  getIpAddress(): string {
    return this.ipAddress;
  }

  getUserAgent(): string | null {
    return this.userAgent;
  }

  getLastActivity(): Date {
    return this.lastActivity;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  isActive(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  revoked(): boolean {
    return this.isRevoked;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  revoke(): void {
    if (this.isRevoked) {
      throw new Error('Session is already revoked');
    }
    this.isRevoked = true;
  }

  updateActivity(): void {
    if (this.isRevoked) {
      throw new Error('Cannot update activity on revoked session');
    }
    if (this.isExpired()) {
      throw new Error('Cannot update activity on expired session');
    }
    this.lastActivity = new Date();
  }
}
