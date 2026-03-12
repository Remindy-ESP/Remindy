import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/modules/users/infrastructure/usersApi';
import toast from 'react-hot-toast';

export function useUserActions() {
    const qc = useQueryClient();

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['admin-users'] });
        qc.invalidateQueries({ queryKey: ['admin-user'] });
    };

    const ban = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            usersApi.ban(id, reason),
        onSuccess: () => {
            invalidate();
            toast.success('Utilisateur banni');
        },
        onError: () => toast.error('Échec du bannissement'),
    });

    const unban = useMutation({
        mutationFn: (id: string) => usersApi.unban(id),
        onSuccess: () => {
            invalidate();
            toast.success('Utilisateur débanni');
        },
        onError: () => toast.error('Échec du débannissement'),
    });

    const verifyEmail = useMutation({
        mutationFn: (id: string) => usersApi.verifyEmail(id),
        onSuccess: () => {
            invalidate();
            toast.success('Email vérifié');
        },
        onError: () => toast.error('Échec de la vérification'),
    });

    const forceMfa = useMutation({
        mutationFn: (id: string) => usersApi.forceMfa(id),
        onSuccess: () => {
            invalidate();
            toast.success('MFA forcé');
        },
        onError: () => toast.error('Échec du forçage MFA'),
    });

    const revokeSessions = useMutation({
        mutationFn: (id: string) => usersApi.revokeSessions(id),
        onSuccess: () => {
            invalidate();
            toast.success('Sessions révoquées');
        },
        onError: () => toast.error('Échec de la révocation'),
    });

    const resetPassword = useMutation({
        mutationFn: (id: string) => usersApi.resetPassword(id),
        onSuccess: () => {
            invalidate();
            toast.success('Mot de passe réinitialisé');
        },
        onError: () => toast.error('Échec de la réinitialisation'),
    });

    return { ban, unban, verifyEmail, forceMfa, revokeSessions, resetPassword };
}
