import { Role } from '../auth/domain/value-objects/role.enum';

export interface QuotaLimits {
  maxFileSize: number;
  maxTotalStorage: number;
  maxDocumentsCount: number;
}

export const UNLIMITED_DOCUMENTS = -1;

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

const ADMIN_LIMITS: QuotaLimits = {
  maxFileSize: 100 * MB,
  maxTotalStorage: 50 * GB,
  maxDocumentsCount: UNLIMITED_DOCUMENTS,
};

export const QUOTA_LIMITS: Record<Role, QuotaLimits> = {
  [Role.USER_FREEMIUM]: {
    maxFileSize: 10 * MB,
    maxTotalStorage: 100 * MB,
    maxDocumentsCount: 50,
  },
  [Role.USER_PREMIUM]: {
    maxFileSize: 50 * MB,
    maxTotalStorage: 10 * GB,
    maxDocumentsCount: 1000,
  },
  [Role.USER_ADMIN]: ADMIN_LIMITS,
  [Role.SUPER_ADMIN]: ADMIN_LIMITS,
};

export function resolveRole(role?: string): Role {
  if (role && (Object.values(Role) as string[]).includes(role)) {
    return role as Role;
  }
  return Role.USER_FREEMIUM;
}

export function getQuotaLimits(role?: string): QuotaLimits {
  return QUOTA_LIMITS[resolveRole(role)];
}

export function isUnknownRole(role: string | undefined, resolved: Role): boolean {
  return !role || (resolved as string) !== role;
}
