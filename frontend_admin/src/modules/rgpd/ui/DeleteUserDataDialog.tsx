import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAdminUsers } from '@/modules/users/application/useAdminUsers';
import { useRgpdActions } from '@/modules/rgpd/application/useRgpdActions';
import type { AdminUser } from '@/shared/domain/types';
import { DeletionConfirmInput } from './DeletionConfirmInput';

const REASON_MIN_LENGTH = 20;
const DEBOUNCE_MS = 300;

const DATA_TO_ANONYMIZE = [
  'Profil utilisateur (email, nom, prénom)',
  'Documents uploadés (références supprimées)',
  'Événements et rappels',
  'Abonnements (dépenses récurrentes)',
  'Notes et catégories personnelles',
  'Historique de connexions',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DeleteUserDataDialog({ open, onClose }: Props) {
  const { deleteUserData } = useRgpdActions();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setDebounced('');
      setSelected(null);
      setConfirmEmail('');
      setReason('');
    }
  }, [open]);

  const { data, isFetching } = useAdminUsers({
    q: debounced || undefined,
    page: 1,
    limit: 20,
  });
  const options = useMemo(() => data?.items ?? [], [data]);

  const emailMatches = !!selected && confirmEmail === selected.email;
  const reasonOk = reason.trim().length >= REASON_MIN_LENGTH;
  const canDelete = emailMatches && reasonOk;

  const handleConfirm = async () => {
    if (!selected || !canDelete) return;
    await deleteUserData.mutateAsync(selected.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color='error' />
        Anonymiser un compte utilisateur
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity='error'>
            <AlertTitle>Action irréversible</AlertTitle>
            Cette opération anonymise les données suivantes et audite
            l&apos;action au niveau <strong>CRITICAL</strong>. Aucun retour en
            arrière n&apos;est possible.
          </Alert>

          <Box>
            <Typography variant='subtitle2' fontWeight={700} gutterBottom>
              Étape 1 — Données qui seront anonymisées
            </Typography>
            <List dense sx={{ pl: 1, py: 0 }}>
              {DATA_TO_ANONYMIZE.map(item => (
                <ListItem key={item} sx={{ py: 0.25 }}>
                  <ListItemText
                    primaryTypographyProps={{ variant: 'body2' }}
                    primary={`• ${item}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant='subtitle2' fontWeight={700} gutterBottom>
              Étape 2 — Sélection de l&apos;utilisateur
            </Typography>
            <Autocomplete
              value={selected}
              onChange={(_, v) => {
                setSelected(v);
                setConfirmEmail('');
              }}
              onInputChange={(_, v, r) => {
                if (r === 'input') setSearch(v);
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
          </Box>

          {selected && (
            <Box>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                Étape 3 — Confirmation par email
              </Typography>
              <DeletionConfirmInput
                expectedEmail={selected.email}
                value={confirmEmail}
                onChange={setConfirmEmail}
              />
            </Box>
          )}

          <Box>
            <Typography variant='subtitle2' fontWeight={700} gutterBottom>
              Étape 4 — Raison
            </Typography>
            <TextField
              label="Raison de l'anonymisation"
              multiline
              minRows={3}
              fullWidth
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
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleteUserData.isPending}>
          Annuler
        </Button>
        <Button
          variant='contained'
          color='error'
          startIcon={<WarningAmberIcon />}
          onClick={handleConfirm}
          disabled={!canDelete || deleteUserData.isPending}
        >
          Anonymiser définitivement
        </Button>
      </DialogActions>
    </Dialog>
  );
}
