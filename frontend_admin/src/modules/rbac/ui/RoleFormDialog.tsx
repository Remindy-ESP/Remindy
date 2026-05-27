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
import Box from '@mui/material/Box';
import { useRoleActions } from '@/modules/rbac/application/useRoleActions';
import type { RoleWithPermissions } from '@/shared/domain/types';

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

const createSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, 'Clé trop courte (2 caractères min)')
    .max(50, 'Clé trop longue (50 caractères max)')
    .regex(
      KEY_REGEX,
      'Clé invalide : minuscules, chiffres et underscores uniquement, commence par une lettre'
    ),
  label: z
    .string()
    .trim()
    .min(2, 'Libellé requis (2 caractères min)')
    .max(100, 'Libellé trop long (100 caractères max)'),
  description: z
    .string()
    .trim()
    .max(500, 'Description trop longue (500 caractères max)')
    .optional(),
});

const editSchema = createSchema.omit({ key: true });

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;
type FormData = CreateFormData;

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  role?: RoleWithPermissions | null;
  onClose: () => void;
}

const EMPTY_VALUES: FormData = { key: '', label: '', description: '' };

export function RoleFormDialog({ open, mode, role, onClose }: Props) {
  const { createRole, updateRole } = useRoleActions();
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && role) {
      reset({
        key: role.key,
        label: role.label,
        description: role.description ?? '',
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [open, isEdit, role, reset]);

  const onSubmit = async (data: FormData) => {
    const description = data.description?.trim() || undefined;

    if (isEdit) {
      if (!role) return;
      const body: EditFormData = { label: data.label.trim(), description };
      await updateRole.mutateAsync({ key: role.key, body });
    } else {
      await createRole.mutateAsync({
        key: data.key.trim(),
        label: data.label.trim(),
        description,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>
          {isEdit ? `Éditer "${role?.label ?? ''}"` : 'Nouveau rôle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              {...register('key')}
              label='Clé'
              placeholder='user_premium_plus'
              autoFocus={!isEdit}
              disabled={isEdit}
              error={!!errors.key}
              helperText={
                errors.key?.message ??
                'Identifiant unique en kebab-case (immuable une fois créé).'
              }
              fullWidth
            />

            <TextField
              {...register('label')}
              label='Libellé'
              placeholder='Premium Plus'
              autoFocus={isEdit}
              error={!!errors.label}
              helperText={errors.label?.message}
              fullWidth
            />

            <TextField
              {...register('description')}
              label='Description (optionnelle)'
              multiline
              minRows={2}
              maxRows={5}
              error={!!errors.description}
              helperText={errors.description?.message ?? '500 caractères max'}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
