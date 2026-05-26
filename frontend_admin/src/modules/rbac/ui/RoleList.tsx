import { useState } from 'react';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { useRoleActions } from '@/modules/rbac/application/useRoleActions';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { AdminPermission, type RoleWithPermissions } from '@/shared/domain/types';
import { RoleFormDialog } from './RoleFormDialog';

interface Props {
  roles: RoleWithPermissions[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

type DialogState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; role: RoleWithPermissions }
  | { type: 'delete'; role: RoleWithPermissions };

export function RoleList({ roles, selectedKey, onSelect }: Props) {
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });
  const [menuFor, setMenuFor] = useState<{
    el: HTMLElement;
    role: RoleWithPermissions;
  } | null>(null);
  const { deleteRole } = useRoleActions();

  const closeDialog = () => setDialog({ type: 'closed' });
  const closeMenu = () => setMenuFor(null);

  const confirmDelete = async () => {
    if (dialog.type !== 'delete') return;
    await deleteRole.mutateAsync(dialog.role.key);
    closeDialog();
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant='subtitle1' fontWeight={600}>
          Rôles ({roles.length})
        </Typography>
        <PermissionGate permission={AdminPermission.RBAC_WRITE}>
          <Button
            size='small'
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setDialog({ type: 'create' })}
          >
            Nouveau
          </Button>
        </PermissionGate>
      </Box>

      <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
        {roles.map(role => {
          const active = role.key === selectedKey;
          return (
            <ListItemButton
              key={role.key}
              selected={active}
              onClick={() => onSelect(role.key)}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {role.isSystem && (
                      <Tooltip title='Rôle système — non modifiable'>
                        <LockIcon
                          fontSize='small'
                          sx={{ color: 'text.secondary' }}
                        />
                      </Tooltip>
                    )}
                    <Typography variant='body2' fontWeight={600}>
                      {role.label}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Typography
                      variant='caption'
                      fontFamily='monospace'
                      sx={{ fontSize: 11 }}
                    >
                      {role.key}
                    </Typography>
                    <Chip
                      label={`${role.permissions.length} perms`}
                      size='small'
                      variant='outlined'
                      sx={{ height: 18, fontSize: 10 }}
                    />
                    {role.isSystem ? (
                      <Chip
                        label='Système'
                        size='small'
                        color='default'
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    ) : (
                      <Chip
                        label='Custom'
                        size='small'
                        color='primary'
                        variant='outlined'
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
              <PermissionGate permission={AdminPermission.RBAC_WRITE}>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    setMenuFor({ el: e.currentTarget, role });
                  }}
                  aria-label={`Actions pour ${role.label}`}
                >
                  <MoreVertIcon fontSize='small' />
                </IconButton>
              </PermissionGate>
            </ListItemButton>
          );
        })}
      </List>

      <Menu
        open={!!menuFor}
        anchorEl={menuFor?.el ?? null}
        onClose={closeMenu}
      >
        <MenuItem
          disabled={menuFor?.role.isSystem}
          onClick={() => {
            if (menuFor) setDialog({ type: 'edit', role: menuFor.role });
            closeMenu();
          }}
        >
          Éditer
        </MenuItem>
        <MenuItem
          disabled={menuFor?.role.isSystem}
          onClick={() => {
            if (menuFor) setDialog({ type: 'delete', role: menuFor.role });
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          Supprimer
        </MenuItem>
      </Menu>

      <RoleFormDialog
        open={dialog.type === 'create' || dialog.type === 'edit'}
        mode={dialog.type === 'edit' ? 'edit' : 'create'}
        role={dialog.type === 'edit' ? dialog.role : null}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={dialog.type === 'delete'}
        title='Supprimer ce rôle ?'
        message={
          dialog.type === 'delete' ? (
            <>
              Cette action supprime définitivement le rôle{' '}
              <strong>{dialog.role.label}</strong> (
              <code>{dialog.role.key}</code>) et ses permissions associées.
              Elle est tracée dans l&apos;audit.
            </>
          ) : (
            ''
          )
        }
        confirmLabel='Supprimer'
        destructive
        loading={deleteRole.isPending}
        onConfirm={confirmDelete}
        onClose={closeDialog}
      />
    </Paper>
  );
}
