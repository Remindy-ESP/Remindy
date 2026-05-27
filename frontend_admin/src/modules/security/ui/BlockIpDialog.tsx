import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { useSecurityActions } from '@/modules/security/application/useSecurityActions';
import { BlockReason } from '@/shared/domain/types';

const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

const REASON_LABELS: Record<BlockReason, string> = {
  [BlockReason.BRUTE_FORCE]: 'Brute force',
  [BlockReason.SUSPICIOUS_ACTIVITY]: 'Activité suspecte',
  [BlockReason.MANUAL]: 'Manuel',
  [BlockReason.RATE_LIMIT]: 'Rate limit',
  [BlockReason.CSRF_ATTACK]: 'Attaque CSRF',
};

const schema = z.object({
  ipAddress: z
    .string()
    .trim()
    .min(1, 'IP requise')
    .refine(
      v => IPV4_REGEX.test(v) || (IPV6_REGEX.test(v) && v.includes(':')),
      'Adresse IP invalide (IPv4 ou IPv6 attendue)'
    ),
  reason: z.enum(BlockReason),
  notes: z
    .string()
    .trim()
    .max(500, 'Note trop longue (500 caractères max)')
    .optional(),
  durationMinutes: z
    .union([z.literal(''), z.coerce.number().int().min(1).max(525_600)])
    .optional(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  ipAddress: '',
  reason: BlockReason.MANUAL,
  notes: '',
  durationMinutes: 60,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BlockIpDialog({ open, onClose }: Props) {
  const { blockIp } = useSecurityActions();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    const duration =
      typeof data.durationMinutes === 'number' && data.durationMinutes > 0
        ? data.durationMinutes
        : undefined;

    await blockIp.mutateAsync({
      ipAddress: data.ipAddress.trim(),
      reason: data.reason,
      notes: data.notes?.trim() || undefined,
      durationMinutes: duration,
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>Bloquer une IP</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              {...register('ipAddress')}
              label='Adresse IP'
              placeholder='192.168.1.100'
              autoFocus
              error={!!errors.ipAddress}
              helperText={errors.ipAddress?.message}
              fullWidth
            />

            <TextField
              {...register('reason')}
              select
              defaultValue={DEFAULT_VALUES.reason}
              label='Raison'
              error={!!errors.reason}
              helperText={errors.reason?.message}
              fullWidth
            >
              {Object.values(BlockReason).map(r => (
                <MenuItem key={r} value={r}>
                  {REASON_LABELS[r]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              {...register('notes')}
              label='Notes (optionnel)'
              multiline
              minRows={2}
              maxRows={5}
              error={!!errors.notes}
              helperText={
                errors.notes?.message ?? 'Contexte interne (500 caractères max)'
              }
              fullWidth
            />

            <TextField
              {...register('durationMinutes')}
              type='number'
              label='Durée (minutes)'
              placeholder='Vide = blocage permanent'
              error={!!errors.durationMinutes}
              helperText={
                errors.durationMinutes?.message ??
                'Laissez vide pour un blocage permanent'
              }
              inputProps={{ min: 1, max: 525_600 }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            Bloquer
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
