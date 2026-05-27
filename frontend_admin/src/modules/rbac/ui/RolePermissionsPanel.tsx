import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import { useRoleActions } from '@/modules/rbac/application/useRoleActions';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { useAuth } from '@/modules/auth/application/AuthContext';
import {
  AdminPermission,
  type RoleWithPermissions,
} from '@/shared/domain/types';
import { PermissionPickerDialog } from './PermissionPickerDialog';

interface Props {
  role: RoleWithPermissions;
}

export function RolePermissionsPanel({ role }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { addPermission, removePermission } = useRoleActions();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(AdminPermission.RBAC_WRITE);

  const handleAddMany = async (permissions: string[]) => {
    for (const permission of permissions) {
      try {
        await addPermission.mutateAsync({ key: role.key, permission });
      } catch {
        // toast emitted by the hook — keep going so partial success still applies
      }
    }
  };

  const handleRemove = (permission: string) => {
    removePermission.mutate({ key: role.key, permission });
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {role.isSystem && (
            <LockIcon fontSize='small' sx={{ color: 'text.secondary' }} />
          )}
          <Typography variant='h6'>{role.label}</Typography>
          <Chip
            label={role.isSystem ? 'Système' : 'Custom'}
            size='small'
            color={role.isSystem ? 'default' : 'primary'}
            variant={role.isSystem ? 'filled' : 'outlined'}
          />
        </Box>
        <Typography
          variant='caption'
          color='text.secondary'
          fontFamily='monospace'
          sx={{ display: 'block', mb: role.description ? 1 : 0 }}
        >
          {role.key}
        </Typography>
        {role.description && (
          <Typography variant='body2' color='text.secondary'>
            {role.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant='subtitle2' fontWeight={600}>
            Permissions ({role.permissions.length})
          </Typography>
          <PermissionGate permission={AdminPermission.RBAC_WRITE}>
            <Button
              size='small'
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={() => setPickerOpen(true)}
            >
              Ajouter
            </Button>
          </PermissionGate>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {role.permissions.length === 0 ? (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ py: 2, textAlign: 'center' }}
          >
            Aucune permission assignée à ce rôle.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {role.permissions.map(p => (
              <Chip
                key={p}
                label={p}
                size='small'
                variant='outlined'
                sx={{ fontFamily: 'monospace', fontSize: 11 }}
                onDelete={
                  canWrite && !removePermission.isPending
                    ? () => handleRemove(p)
                    : undefined
                }
              />
            ))}
          </Box>
        )}
      </Box>

      <PermissionPickerDialog
        open={pickerOpen}
        alreadyAssigned={role.permissions}
        loading={addPermission.isPending}
        onClose={() => setPickerOpen(false)}
        onSubmit={handleAddMany}
      />
    </Paper>
  );
}
