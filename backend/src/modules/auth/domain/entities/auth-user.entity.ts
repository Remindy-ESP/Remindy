import { UserStatus } from "src/infrastructure/database/entities/user.entity";

export class AuthUser {
  constructor(
    private readonly props: {
    id?: string;
    email: string;
    passwordHash: string;
    role_key: string;
    status: UserStatus;
    firstName: string;
    lastName: string;
    phone?: string;
    failedLoginCount: number;
    emailVerified: boolean;
    mfaEnabled: boolean;
    mfaSecret?: string;
    createdAt?: Date;
    }
  ) {}

  // Factory
static createNew(params: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role_key?: string;
}) {
  return new AuthUser({
    email: params.email,
    passwordHash: params.passwordHash,
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    role_key: params.role_key ?? 'user_freemium',
    status: UserStatus.ACTIVE,
    failedLoginCount: 0,
    emailVerified: false,
    mfaEnabled: false,
    createdAt: new Date(),
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
}
