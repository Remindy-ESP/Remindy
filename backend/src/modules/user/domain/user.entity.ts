import { Email } from './email.vo';
import { UserStatus } from './user-status.enum';

/**
 * User Domain Entity
 * Contient la logique métier pure, indépendante de TypeORM
 */
export class User {
  private id: string;
  private email: Email;
  private passwordHash: string | null;
  private firstName: string | null;
  private lastName: string | null;
  private phone: string | null;
  private photoR2Key: string | null;
  private role: string;
  private status: UserStatus;
  private timezone: string;
  private language: string;
  private emailVerified: boolean;
  private mfaEnabled: boolean;
  private mfaSecret: string | null;
  private lastLoginAt: Date | null;
  private failedLoginCount: number;
  private passwordChangedAt: Date | null;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(props: {
    id: string;
    email: Email;
    passwordHash?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    photoR2Key?: string | null;
    role: string;
    status?: UserStatus;
    timezone?: string;
    language?: string;
    emailVerified?: boolean;
    mfaEnabled?: boolean;
    mfaSecret?: string | null;
    lastLoginAt?: Date | null;
    failedLoginCount?: number;
    passwordChangedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash ?? null;
    this.firstName = props.firstName ?? null;
    this.lastName = props.lastName ?? null;
    this.phone = props.phone ?? null;
    this.photoR2Key = props.photoR2Key ?? null;
    this.role = props.role;
    this.status = props.status ?? UserStatus.ACTIVE;
    this.timezone = props.timezone ?? 'Europe/Paris';
    this.language = props.language ?? 'fr';
    this.emailVerified = props.emailVerified ?? false;
    this.mfaEnabled = props.mfaEnabled ?? false;
    this.mfaSecret = props.mfaSecret ?? null;
    this.lastLoginAt = props.lastLoginAt ?? null;
    this.failedLoginCount = props.failedLoginCount ?? 0;
    this.passwordChangedAt = props.passwordChangedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
  }

  // Factory method pour créer un nouveau user
  static create(props: {
    id: string;
    email: string;
    role: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
  }): User {
    return new User({
      id: props.id,
      email: new Email(props.email),
      passwordHash: props.passwordHash,
      firstName: props.firstName,
      lastName: props.lastName,
      role: props.role,
    });
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getEmailValue(): string {
    return this.email.getValue();
  }

  getPasswordHash(): string | null {
    return this.passwordHash;
  }

  getFirstName(): string | null {
    return this.firstName;
  }

  getLastName(): string | null {
    return this.lastName;
  }

  getFullName(): string {
    const parts = [this.firstName, this.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : this.getEmailValue();
  }

  getPhone(): string | null {
    return this.phone;
  }

  getPhotoR2Key(): string | null {
    return this.photoR2Key;
  }

  getRole(): string {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getTimezone(): string {
    return this.timezone;
  }

  getLanguage(): string {
    return this.language;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  isMfaEnabled(): boolean {
    return this.mfaEnabled;
  }

  getMfaSecret(): string | null {
    return this.mfaSecret;
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt;
  }

  getFailedLoginCount(): number {
    return this.failedLoginCount;
  }

  getPasswordChangedAt(): Date | null {
    return this.passwordChangedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  // Business Logic Methods
  canLogin(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isDeleted() && this.failedLoginCount < 5;
  }

  isLocked(): boolean {
    return this.failedLoginCount >= 5;
  }

  isBanned(): boolean {
    return this.status === UserStatus.BANNED;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isDeleted();
  }

  // Actions
  verifyEmail(): void {
    if (this.emailVerified) {
      throw new Error('Email is already verified');
    }
    this.emailVerified = true;
    this.status = UserStatus.VERIFIED;
    this.touch();
  }

  recordSuccessfulLogin(): void {
    this.lastLoginAt = new Date();
    this.failedLoginCount = 0;
    this.touch();
  }

  recordFailedLogin(): void {
    this.failedLoginCount++;
    this.touch();

    if (this.failedLoginCount >= 5) {
      throw new Error('Account locked due to too many failed login attempts');
    }
  }

  resetFailedLoginCount(): void {
    this.failedLoginCount = 0;
    this.touch();
  }

  updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash || newPasswordHash.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    this.passwordHash = newPasswordHash;
    this.passwordChangedAt = new Date();
    this.touch();
  }

  enableMfa(secret: string): void {
    if (this.mfaEnabled) {
      throw new Error('MFA is already enabled');
    }
    this.mfaEnabled = true;
    this.mfaSecret = secret;
    this.touch();
  }

  disableMfa(): void {
    if (!this.mfaEnabled) {
      throw new Error('MFA is not enabled');
    }
    this.mfaEnabled = false;
    this.mfaSecret = null;
    this.touch();
  }

  updateProfile(props: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    timezone?: string;
    language?: string;
  }): void {
    if (props.firstName !== undefined) this.firstName = props.firstName;
    if (props.lastName !== undefined) this.lastName = props.lastName;
    if (props.phone !== undefined) this.phone = props.phone;
    if (props.timezone !== undefined) this.timezone = props.timezone;
    if (props.language !== undefined) this.language = props.language;
    this.touch();
  }

  updatePhotoR2Key(key: string | null): void {
    this.photoR2Key = key;
    this.touch();
  }

  ban(_reason?: string): void {
    if (this.status === UserStatus.BANNED) {
      throw new Error('User is already banned');
    }
    this.status = UserStatus.BANNED;
    this.touch();
  }

  unban(): void {
    if (this.status !== UserStatus.BANNED) {
      throw new Error('User is not banned');
    }
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.touch();
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  softDelete(): void {
    if (this.deletedAt) {
      throw new Error('User is already deleted');
    }
    this.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    if (!this.deletedAt) {
      throw new Error('User is not deleted');
    }
    this.deletedAt = null;
    this.touch();
  }

  // Helper
  private touch(): void {
    this.updatedAt = new Date();
  }
}
