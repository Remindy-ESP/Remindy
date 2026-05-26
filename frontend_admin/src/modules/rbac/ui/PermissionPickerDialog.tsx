import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import { AdminPermission } from '@/shared/domain/types';

const ALL_PERMISSIONS: string[] = Object.values(AdminPermission);

function groupName(permission: string): string {
  // "admin.users.write" -> "users"
  const parts = permission.split('.');
  return parts[1] ?? permission;
}

function groupPermissions(perms: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const p of perms) {
    const key = groupName(p);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }
  return grouped;
}

interface Props {
  open: boolean;
  alreadyAssigned: string[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (permissions: string[]) => Promise<void> | void;
}

export function PermissionPickerDialog({
  open,
  alreadyAssigned,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelected(new Set());
    }
  }, [open]);

  const available = useMemo(() => {
    const assigned = new Set(alreadyAssigned);
    return ALL_PERMISSIONS.filter(p => !assigned.has(p));
  }, [alreadyAssigned]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(p => p.toLowerCase().includes(q));
  }, [available, search]);

  const grouped = useMemo(() => groupPermissions(filtered), [filtered]);

  const toggle = (permission: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    await onSubmit(Array.from(selected));
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Ajouter des permissions</DialogTitle>
      <DialogContent dividers>
        <TextField
          size='small'
          fullWidth
          placeholder='Rechercher (ex: users, write…)'
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {available.length === 0 ? (
          <Typography color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
            Toutes les permissions sont déjà assignées à ce rôle.
          </Typography>
        ) : grouped.size === 0 ? (
          <Typography color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
            Aucune permission ne correspond à votre recherche.
          </Typography>
        ) : (
          <Box>
            {Array.from(grouped.entries()).map(([group, perms], idx) => (
              <Box key={group} sx={{ mb: 2 }}>
                {idx > 0 && <Divider sx={{ my: 1 }} />}
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {group}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                  {perms.map(p => (
                    <FormControlLabel
                      key={p}
                      control={
                        <Checkbox
                          size='small'
                          checked={selected.has(p)}
                          onChange={() => toggle(p)}
                        />
                      }
                      label={
                        <Typography
                          variant='body2'
                          fontFamily='monospace'
                          sx={{ fontSize: 12 }}
                        >
                          {p}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={selected.size === 0 || loading}
        >
          Ajouter ({selected.size})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
