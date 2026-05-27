import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from '../value-objects/role.enum';

export class AuthUser {
  constructor(
    private readonly props: {
      id?: string;
      email: string;
      passwordHash: string | null;
      role_key: Role;
      status: UserStatus;
      firstName: string;
      lastName: string;
      phone?: string;
      failedLoginCount: number;
      emailVerified: boolean;
      mfaEnabled: boolean;
      mfaSecret?: string;
      createdAt?: Date;
      googleId?: string | null;
      microsoftId?: string | null;
      appleId?: string | null;
    },
  ) {}

  // Factory — traditional email/password sign-up
  static createNew(params: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role_key?: Role;
  }) {
    return new AuthUser({
      email: params.email,
      passwordHash: params.passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      role_key: params.role_key ?? Role.USER_FREEMIUM,
      status: UserStatus.ACTIVE,
      failedLoginCount: 0,
      emailVerified: false,
      mfaEnabled: false,
      createdAt: new Date(),
    });
  }

  // Factory — OAuth sign-in (no password)
  static createFromOAuth(params: {
    email: string;
    firstName: string;
    lastName: string;
    googleId?: string;
    microsoftId?: string;
    appleId?: string;
  }) {
    return new AuthUser({
      email: params.email,
      passwordHash: null,
      firstName: params.firstName,
      lastName: params.lastName,
      role_key: Role.USER_FREEMIUM,
      status: UserStatus.ACTIVE,
      failedLoginCount: 0,
      emailVerified: true,
      mfaEnabled: false,
      googleId: params.googleId,
      microsoftId: params.microsoftId,
      appleId: params.appleId,
    });
  }

  getId(): string {
    if (!this.props.id) {
      throw new Error('AuthUser ID is not defined');
    }
    return this.props.id;
  }

  getEmail() {
    return this.props.email;
  }

  getPasswordHash() {
    return this.props.passwordHash;
  }

  getFirstName() {
    return this.props.firstName;
  }

  getLastName() {
    return this.props.lastName;
  }

  getPhone() {
    return this.props.phone;
  }

  getRoleKey() {
    return this.props.role_key;
  }

  getStatus() {
    return this.props.status;
  }

  getFailedLoginCount() {
    return this.props.failedLoginCount;
  }

  isEmailVerified() {
    return this.props.emailVerified;
  }

  isMfaEnabled() {
    return this.props.mfaEnabled;
  }

  getMfaSecret() {
    return this.props.mfaSecret;
  }

  getCreatedAt() {
    return this.props.createdAt;
  }

  getGoogleId() {
    return this.props.googleId ?? null;
  }

  getMicrosoftId() {
    return this.props.microsoftId ?? null;
  }

  getAppleId() {
    return this.props.appleId ?? null;
  }
}
