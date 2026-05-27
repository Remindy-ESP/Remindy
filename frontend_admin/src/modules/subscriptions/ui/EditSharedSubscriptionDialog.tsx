import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useSubscriptionActions } from '@/modules/subscriptions/application/useSubscriptionActions';
import { SUBSCRIPTION_STATUS_LABELS } from './SubscriptionStatusBadge';
import { SubscriptionStatus, type Subscription } from '@/shared/domain/types';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(255, 'Maximum 255 caractères'),
  amount: z
    .number({ error: 'Montant invalide' })
    .min(0, 'Le montant doit être positif'),
  status: z.enum(SubscriptionStatus),
  notes: z
    .string()
    .trim()
    .max(2000, 'Maximum 2000 caractères')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  subscription: Subscription;
  open: boolean;
  onClose: () => void;
}

export function EditSharedSubscriptionDialog({
  subscription,
  open,
  onClose,
}: Props) {
  const { updateShared } = useSubscriptionActions();

  const defaults: FormData = {
    name: subscription.name,
    amount: Number(subscription.amount),
    status: subscription.status,
    notes: subscription.notes ?? '',
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription.id]);

  const onSubmit = async (data: FormData) => {
    await updateShared.mutateAsync({
      id: subscription.id,
      body: {
        name: data.name,
        amount: data.amount,
        status: data.status,
        notes: data.notes || undefined,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>Éditer l&apos;abonnement</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              {...register('name')}
              label='Nom'
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <TextField
              {...register('amount', { valueAsNumber: true })}
              label='Montant'
              type='number'
              inputProps={{ step: '0.01', min: 0 }}
              fullWidth
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />

            <Controller
              control={control}
              name='status'
              render={({ field }) => (
                <TextField {...field} select label='Statut' fullWidth>
                  {Object.values(SubscriptionStatus).map(s => (
                    <MenuItem key={s} value={s}>
                      {SUBSCRIPTION_STATUS_LABELS[s]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField
              {...register('notes')}
              label='Notes'
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isSubmitting || !isDirty}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
