import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminPermissions, AdminPermission } from './admin.permissions';

const ALL: AdminPermission[] = Object.values(AdminPermissions);

export function permissionsForRole(role: Role): AdminPermission[] {
  switch (role) {
    case Role.SUPER_ADMIN:
      return ALL;

    case Role.USER_ADMIN:
      return [
        AdminPermissions.DASHBOARD_READ,
        AdminPermissions.USERS_READ,
        AdminPermissions.USERS_WRITE,
        AdminPermissions.SUPPORT_READ,
        AdminPermissions.SUPPORT_WRITE,
        AdminPermissions.SUBSCRIPTIONS_READ,
        AdminPermissions.AUDIT_READ,
        AdminPermissions.RBAC_READ,
      ];

    default:
      return [];
  }
}
