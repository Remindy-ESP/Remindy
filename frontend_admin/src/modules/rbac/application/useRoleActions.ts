import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rbacApi } from '@/modules/rbac/infrastructure/rbacApi';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@/shared/domain/types';

function extractMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message ?? fallback;
}

export function useRoleActions() {
  const queryClient = useQueryClient();

  const invalidateRoles = () =>
    queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });

  const createRole = useMutation({
    mutationFn: (body: CreateRoleRequest) => rbacApi.create(body),
    onSuccess: () => {
      invalidateRoles();
      toast.success('Rôle créé.');
    },
    onError: err => {
      toast.error(extractMessage(err, 'Échec de la création du rôle.'));
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ key, body }: { key: string; body: UpdateRoleRequest }) =>
      rbacApi.update(key, body),
    onSuccess: () => {
      invalidateRoles();
      toast.success('Rôle mis à jour.');
    },
    onError: err => {
      toast.error(extractMessage(err, 'Échec de la mise à jour du rôle.'));
    },
  });

  const deleteRole = useMutation({
    mutationFn: (key: string) => rbacApi.remove(key),
    onSuccess: () => {
      invalidateRoles();
      toast.success('Rôle supprimé.');
    },
    onError: err => {
      toast.error(extractMessage(err, 'Échec de la suppression du rôle.'));
    },
  });

  const addPermission = useMutation({
    mutationFn: ({ key, permission }: { key: string; permission: string }) =>
      rbacApi.addPermission(key, permission),
    onSuccess: () => {
      invalidateRoles();
      toast.success('Permission ajoutée.');
    },
    onError: err => {
      toast.error(extractMessage(err, "Échec de l'ajout de la permission."));
    },
  });

  const removePermission = useMutation({
    mutationFn: ({ key, permission }: { key: string; permission: string }) =>
      rbacApi.removePermission(key, permission),
    onSuccess: () => {
      invalidateRoles();
      toast.success('Permission retirée.');
    },
    onError: err => {
      toast.error(extractMessage(err, 'Échec du retrait de la permission.'));
    },
  });

  return {
    createRole,
    updateRole,
    deleteRole,
    addPermission,
    removePermission,
  };
}
