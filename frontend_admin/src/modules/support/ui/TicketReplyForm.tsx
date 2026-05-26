import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import { useTicketActions } from '@/modules/support/application/useTicketActions';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import {
  TICKET_STATUS_LABELS,
} from './TicketStatusBadge';
import { AdminPermission, SupportTicketStatus } from '@/shared/domain/types';

const MIN_LENGTH = 5;
const MAX_LENGTH = 4000;

const schema = z.object({
  message: z
    .string()
    .trim()
    .min(MIN_LENGTH, `Message trop court (${MIN_LENGTH} caractères min)`)
    .max(MAX_LENGTH, `Message trop long (${MAX_LENGTH} caractères max)`),
  status: z
    .union([z.literal(''), z.enum(SupportTicketStatus)])
    .optional(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = { message: '', status: '' };

interface Props {
  ticketId: string;
  ticketStatus: SupportTicketStatus;
}

export function TicketReplyForm({ ticketId, ticketStatus }: Props) {
  const { reply } = useTicketActions(ticketId);
  const isClosed = ticketStatus === SupportTicketStatus.CLOSED;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const messageValue = watch('message') ?? '';

  const onSubmit = async (data: FormData) => {
    await reply.mutateAsync({
      message: data.message.trim(),
      status: data.status || undefined,
    });
    reset(DEFAULT_VALUES);
  };

  useEffect(() => {
    if (isClosed) reset(DEFAULT_VALUES);
  }, [isClosed, reset]);

  return (
    <PermissionGate permission={AdminPermission.SUPPORT_WRITE}>
      <Paper component='form' onSubmit={handleSubmit(onSubmit)} sx={{ p: 2 }} noValidate>
        <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
          Répondre
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {isClosed ? (
          <Typography color='text.secondary' fontSize='small'>
            Ce ticket est fermé — aucune réponse possible.
          </Typography>
        ) : (
          <>
            <TextField
              {...register('message')}
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              placeholder='Votre réponse…'
              error={!!errors.message}
              helperText={
                errors.message?.message ??
                `${messageValue.length} / ${MAX_LENGTH} caractères`
              }
              sx={{ mb: 2 }}
              aria-label='Réponse'
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Controller
                control={control}
                name='status'
                render={({ field }) => (
                  <TextField
                    {...field}
                    size='small'
                    select
                    label='Changer le statut'
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value=''>Inchangé</MenuItem>
                    {Object.values(SupportTicketStatus).map(s => (
                      <MenuItem key={s} value={s}>
                        {TICKET_STATUS_LABELS[s]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Button
                type='submit'
                variant='contained'
                endIcon={<SendIcon />}
                disabled={isSubmitting}
                sx={{ ml: 'auto' }}
              >
                Envoyer
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </PermissionGate>
  );
}
