import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type Role = 'user_freemium' | 'user_premium' | 'user_admin' | 'super_admin';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
