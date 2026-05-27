import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useAdminUsers } from '@/modules/users/application/useAdminUsers';
import { useRgpdActions } from '@/modules/rgpd/application/useRgpdActions';
import type { AdminUser } from '@/shared/domain/types';

const REASON_MIN_LENGTH = 10;
const DEBOUNCE_MS = 300;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RequestExportDialog({ open, onClose }: Props) {
  const { requestExport } = useRgpdActions();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setDebounced('');
      setSelected(null);
      setReason('');
      setConfirmed(false);
    }
  }, [open]);

  const { data, isFetching } = useAdminUsers({
    q: debounced || undefined,
    page: 1,
    limit: 20,
  });
  const options = useMemo(() => data?.items ?? [], [data]);

  const reasonOk = reason.trim().length >= REASON_MIN_LENGTH;
  const canSubmit = !!selected && reasonOk && confirmed;

  const handleSubmit = async () => {
    if (!selected) return;
    await requestExport.mutateAsync(selected.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Demander un export RGPD</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Autocomplete
            value={selected}
            onChange={(_, v) => setSelected(v)}
            onInputChange={(_, v, reason) => {
              if (reason === 'input') setSearch(v);
            }}
            options={options}
            getOptionLabel={u => u.email}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            loading={isFetching}
            filterOptions={x => x}
            renderInput={params => (
              <TextField
                {...params}
                label='Utilisateur'
                placeholder='Email ou nom…'
                required
              />
            )}
            renderOption={(props, u) => (
              <li {...props} key={u.id}>
                <Box>
                  <Typography variant='body2'>{u.email}</Typography>
                  {(u.firstName || u.lastName) && (
                    <Typography variant='caption' color='text.secondary'>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />

          {selected && (
            <Alert severity='info' icon={false}>
              <Typography variant='body2'>
                <strong>Email :</strong> {selected.email}
              </Typography>
              <Typography variant='body2'>
                <strong>Rôle :</strong> {selected.role}
              </Typography>
              <Typography variant='body2'>
                <strong>Statut :</strong> {selected.status}
              </Typography>
            </Alert>
          )}

          <TextField
            label='Raison de la demande'
            multiline
            minRows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            helperText={
              reasonOk
                ? `${reason.trim().length} caractères`
                : `Minimum ${REASON_MIN_LENGTH} caractères (${reason.trim().length})`
            }
            error={reason.length > 0 && !reasonOk}
            required
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
              />
            }
            label='Je confirme que cette action sera auditée (severity WARNING)'
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={requestExport.isPending}>
          Annuler
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={!canSubmit || requestExport.isPending}
        >
          Demander l&apos;export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
