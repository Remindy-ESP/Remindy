import apiClient from '@/shared/infrastructure/apiClient';
import type {
  CreateRoleRequest,
  RolePermissionResponse,
  RoleWithPermissions,
  UpdateRoleRequest,
} from '@/shared/domain/types';

export const rbacApi = {
  list() {
    return apiClient
      .get<RoleWithPermissions[]>('/admin/roles')
      .then(r => r.data);
  },

  create(body: CreateRoleRequest) {
    return apiClient
      .post<RoleWithPermissions>('/admin/roles', body)
      .then(r => r.data);
  },

  update(key: string, body: UpdateRoleRequest) {
    return apiClient
      .put<RoleWithPermissions>(
        `/admin/roles/${encodeURIComponent(key)}`,
        body
      )
      .then(r => r.data);
  },

  remove(key: string) {
    return apiClient
      .delete<{ ok: true; key: string }>(
        `/admin/roles/${encodeURIComponent(key)}`
      )
      .then(r => r.data);
  },

  addPermission(key: string, permission: string) {
    return apiClient
      .post<RolePermissionResponse>(
        `/admin/roles/${encodeURIComponent(key)}/permissions`,
        { permission }
      )
      .then(r => r.data);
  },

  removePermission(key: string, permission: string) {
    return apiClient
      .delete<RolePermissionResponse>(
        `/admin/roles/${encodeURIComponent(key)}/permissions`,
        { data: { permission } }
      )
      .then(r => r.data);
  },
};
