import type { ReactNode } from 'react';
import type { AdminPermission } from '@/shared/domain/types';
import { useAuth } from '@/modules/auth/application/AuthContext';

interface Props {
  permission: AdminPermission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: Props) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
