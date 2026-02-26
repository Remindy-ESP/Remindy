export const AdminPermissions = {
  DASHBOARD_READ: 'admin.dashboard.read',

  USERS_READ: 'admin.users.read',
  USERS_WRITE: 'admin.users.write',

  SUPPORT_READ: 'admin.support.read',
  SUPPORT_WRITE: 'admin.support.write',

  SUBSCRIPTIONS_READ: 'admin.subscriptions.read',
  SUBSCRIPTIONS_WRITE: 'admin.subscriptions.write',

  AUDIT_READ: 'admin.audit.read',

  SECURITY_READ: 'admin.security.read',
  SECURITY_WRITE: 'admin.security.write',

  RGPD_EXPORT: 'admin.rgpd.export',
  RGPD_DELETE: 'admin.rgpd.delete',

  CLOUD_READ: 'admin.cloud.read',
  CLOUD_WRITE: 'admin.cloud.write',

  RBAC_READ: 'admin.rbac.read',
  RBAC_WRITE: 'admin.rbac.write',
} as const;

export type AdminPermission = (typeof AdminPermissions)[keyof typeof AdminPermissions];
