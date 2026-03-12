// --- Enums ---

export enum Role {
    USER_FREEMIUM = 'user_freemium',
    USER_PREMIUM = 'user_premium',
    USER_ADMIN = 'user_admin',
    SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
    ACTIVE = 'active',
    VERIFIED = 'verified',
    BANNED = 'banned',
    INACTIVE = 'inactive',
}

export enum Severity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

export enum AdminPermission {
    DASHBOARD_READ = 'admin.dashboard.read',
    USERS_READ = 'admin.users.read',
    USERS_WRITE = 'admin.users.write',
    SUPPORT_READ = 'admin.support.read',
    SUPPORT_WRITE = 'admin.support.write',
    SUBSCRIPTIONS_READ = 'admin.subscriptions.read',
    SUBSCRIPTIONS_WRITE = 'admin.subscriptions.write',
    AUDIT_READ = 'admin.audit.read',
    SECURITY_READ = 'admin.security.read',
    SECURITY_WRITE = 'admin.security.write',
    RGPD_EXPORT = 'admin.rgpd.export',
    RGPD_DELETE = 'admin.rgpd.delete',
    CLOUD_READ = 'admin.cloud.read',
    CLOUD_WRITE = 'admin.cloud.write',
    RBAC_READ = 'admin.rbac.read',
    RBAC_WRITE = 'admin.rbac.write',
}

// --- DTOs ---

export interface AdminUser {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
    status: UserStatus;
    emailVerified: boolean;
    mfaEnabled: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
    failedLoginCount: number;
    updatedAt: string;
    deletedAt: string | null;
    sessionsCount: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminMeResponse {
    id: string;
    role: Role;
    mfaEnabled: boolean;
    mfaVerified: boolean;
    permissions: AdminPermission[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userId: string;
}

export interface MfaSetupResponse {
    otpauthUrl: string;
    qrCodeDataUrl: string;
}

export interface MfaVerifyResponse {
    accessToken: string;
}

export interface UserListQuery {
    q?: string;
    role?: Role;
    status?: UserStatus;
    emailVerified?: boolean;
    mfaEnabled?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'status';
    sortDir?: 'ASC' | 'DESC';
}
