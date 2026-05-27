import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockResetIcon from '@mui/icons-material/LockReset';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import LogoutIcon from '@mui/icons-material/Logout';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useAdminUser } from '@/modules/users/application/useAdminUsers';
import { useUserActions } from '@/modules/users/application/useUserActions';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { InlineLoader, ErrorState } from '@/shared/ui/NetworkStates';
import { AdminPermission, UserStatus } from '@/shared/domain/types';
import { UserActionDialog } from './UserActionDialog';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  user_freemium: 'Freemium',
  user_premium: 'Premium',
  user_admin: 'Admin',
  super_admin: 'Super Admin',
};

const STATUS_COLORS: Record<
  string,
  'success' | 'error' | 'warning' | 'default'
> = {
  active: 'success',
  verified: 'success',
  banned: 'error',
  inactive: 'warning',
};

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ width: 180, flexShrink: 0, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, isError, refetch } = useAdminUser(id!);
  const actions = useUserActions();
  const [dialog, setDialog] = useState<{ type: string; open: boolean }>({
    type: '',
    open: false,
  });

  if (isLoading) return <InlineLoader />;
  if (isError || !user)
    return <ErrorState message='Utilisateur introuvable.' onRetry={refetch} />;

  const isBanned = user.status === UserStatus.BANNED;
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('fr-FR') : '—';

  const handleAction = async (type: string, reason?: string) => {
    switch (type) {
      case 'ban':
        await actions.ban.mutateAsync({ id: user.id, reason });
        break;
      case 'unban':
        await actions.unban.mutateAsync(user.id);
        break;
      case 'verifyEmail':
        await actions.verifyEmail.mutateAsync(user.id);
        break;
      case 'forceMfa':
        await actions.forceMfa.mutateAsync(user.id);
        break;
      case 'revokeSessions':
        await actions.revokeSessions.mutateAsync(user.id);
        break;
      case 'resetPassword':
        await actions.resetPassword.mutateAsync(user.id);
        break;
    }
    setDialog({ type: '', open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title='Retour à la liste'>
          <IconButton onClick={() => navigate('/users')} aria-label='Retour'>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant='h4'>Détail utilisateur</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profil */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Profil
            </Typography>
            <InfoRow label='ID'>
              <Typography variant='body2' fontFamily='monospace'>
                {user.id}
              </Typography>
            </InfoRow>
            <InfoRow label='Email'>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant='body2'>{user.email}</Typography>
                <PermissionGate permission={AdminPermission.SUPPORT_READ}>
                  <Button
                    size='small'
                    variant='text'
                    startIcon={<SupportAgentIcon fontSize='small' />}
                    onClick={() =>
                      navigate(`/support?q=${encodeURIComponent(user.email)}`)
                    }
                  >
                    Voir les tickets
                  </Button>
                </PermissionGate>
              </Box>
            </InfoRow>
            <InfoRow label='Nom'>
              <Typography variant='body2'>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                  '—'}
              </Typography>
            </InfoRow>
            <InfoRow label='Rôle'>
              <Chip
                label={ROLE_LABELS[user.role] || user.role}
                size='small'
                variant='outlined'
              />
            </InfoRow>
            <InfoRow label='Statut'>
              <Chip
                label={user.status}
                size='small'
                color={STATUS_COLORS[user.status] || 'default'}
              />
            </InfoRow>
            <InfoRow label='Email vérifié'>
              <Typography variant='body2'>
                {user.emailVerified ? '✅ Oui' : '❌ Non'}
              </Typography>
            </InfoRow>
            <InfoRow label='MFA'>
              <Typography variant='body2'>
                {user.mfaEnabled ? '✅ Activé' : '❌ Désactivé'}
              </Typography>
            </InfoRow>
            <InfoRow label='Sessions actives'>
              <Typography variant='body2'>{user.sessionsCount}</Typography>
            </InfoRow>
            <InfoRow label='Tentatives échouées'>
              <Typography variant='body2'>{user.failedLoginCount}</Typography>
            </InfoRow>
            <InfoRow label='Dernière connexion'>
              <Typography variant='body2'>
                {fmtDate(user.lastLoginAt)}
              </Typography>
            </InfoRow>
            <InfoRow label='Créé le'>
              <Typography variant='body2'>{fmtDate(user.createdAt)}</Typography>
            </InfoRow>
            <InfoRow label='Modifié le'>
              <Typography variant='body2'>{fmtDate(user.updatedAt)}</Typography>
            </InfoRow>
          </Paper>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <PermissionGate permission={AdminPermission.USERS_WRITE}>
            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Ban / Unban */}
                {isBanned ? (
                  <Button
                    variant='outlined'
                    color='success'
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setDialog({ type: 'unban', open: true })}
                    fullWidth
                  >
                    Débannir
                  </Button>
                ) : (
                  <Button
                    variant='outlined'
                    color='error'
                    startIcon={<BlockIcon />}
                    onClick={() => setDialog({ type: 'ban', open: true })}
                    fullWidth
                  >
                    Bannir
                  </Button>
                )}

                {/* Reset password */}
                <Button
                  variant='outlined'
                  startIcon={<LockResetIcon />}
                  onClick={() =>
                    setDialog({ type: 'resetPassword', open: true })
                  }
                  fullWidth
                >
                  Réinitialiser le MDP
                </Button>

                {/* Verify email */}
                {!user.emailVerified && (
                  <Button
                    variant='outlined'
                    color='info'
                    startIcon={<VerifiedUserIcon />}
                    onClick={() =>
                      setDialog({ type: 'verifyEmail', open: true })
                    }
                    fullWidth
                  >
                    Vérifier l&apos;email
                  </Button>
                )}

                {/* Force MFA */}
                {!user.mfaEnabled && (
                  <Button
                    variant='outlined'
                    color='warning'
                    startIcon={<SecurityIcon />}
                    onClick={() => setDialog({ type: 'forceMfa', open: true })}
                    fullWidth
                  >
                    Forcer MFA
                  </Button>
                )}

                {/* Revoke sessions */}
                <Button
                  variant='outlined'
                  color='warning'
                  startIcon={<LogoutIcon />}
                  onClick={() =>
                    setDialog({ type: 'revokeSessions', open: true })
                  }
                  fullWidth
                >
                  Révoquer les sessions
                </Button>
              </Box>
            </Paper>
          </PermissionGate>
        </Grid>
      </Grid>

      {/* Confirmation dialog */}
      <UserActionDialog
        open={dialog.open}
        type={dialog.type}
        userEmail={user.email}
        onConfirm={reason => handleAction(dialog.type, reason)}
        onCancel={() => setDialog({ type: '', open: false })}
      />
    </Box>
  );
}
