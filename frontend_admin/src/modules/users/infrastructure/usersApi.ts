import apiClient from '@/shared/infrastructure/apiClient';
import type {
    AdminUser,
    AdminUserDetail,
    PaginatedResponse,
    UserListQuery,
} from '@/shared/domain/types';

export const usersApi = {
    list(params: UserListQuery) {
        return apiClient
            .get<PaginatedResponse<AdminUser>>('/admin/users', { params })
            .then((r) => r.data);
    },

    getById(id: string) {
        return apiClient
            .get<AdminUserDetail>(`/admin/users/${id}`)
            .then((r) => r.data);
    },

    ban(id: string, reason?: string) {
        return apiClient
            .post(`/admin/users/${id}/ban`, { reason })
            .then((r) => r.data);
    },

    unban(id: string) {
        return apiClient
            .post(`/admin/users/${id}/unban`)
            .then((r) => r.data);
    },

    verifyEmail(id: string) {
        return apiClient
            .post(`/admin/users/${id}/verify-email`)
            .then((r) => r.data);
    },

    forceMfa(id: string) {
        return apiClient
            .post(`/admin/users/${id}/force-mfa`)
            .then((r) => r.data);
    },

    revokeSessions(id: string) {
        return apiClient
            .post(`/admin/users/${id}/revoke-sessions`)
            .then((r) => r.data);
    },

    resetPassword(id: string) {
        return apiClient
            .post(`/admin/users/${id}/reset-password`)
            .then((r) => r.data);
    },
};
