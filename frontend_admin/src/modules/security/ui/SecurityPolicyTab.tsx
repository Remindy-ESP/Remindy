import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import { useSecurityPolicy } from '@/modules/security/application/useSecurityPolicy';
import { useSecurityActions } from '@/modules/security/application/useSecurityActions';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { ErrorState, InlineLoader } from '@/shared/ui/NetworkStates';
import {
  AdminPermission,
  type SecurityPolicy,
  type UpdateSecurityPolicyRequest,
} from '@/shared/domain/types';

const schema = z.object({
  maxLoginAttempts: z.coerce.number().int().min(1).max(20),
  lockoutDurationMinutes: z.coerce.number().int().min(1).max(1440),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440),
  requireMfaForAdmin: z.boolean(),
  minPasswordLength: z.coerce.number().int().min(8).max(128),
  requireUppercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordExpiryDays: z.coerce.number().int().min(0).max(365),
  rateLimitPerMinute: z.coerce.number().int().min(10).max(10_000),
  autoBlockAfterRequests: z.coerce.number().int().min(5).max(1000),
  autoBlockDurationMinutes: z.coerce.number().int().min(1).max(1440),
  allowedOriginsCsv: z.string().trim(),
});

type FormData = z.infer<typeof schema>;

function policyToForm(policy: SecurityPolicy): FormData {
  return {
    maxLoginAttempts: policy.maxLoginAttempts,
    lockoutDurationMinutes: policy.lockoutDurationMinutes,
    sessionTimeoutMinutes: policy.sessionTimeoutMinutes,
    requireMfaForAdmin: policy.requireMfaForAdmin,
    minPasswordLength: policy.minPasswordLength,
    requireUppercase: policy.requireUppercase,
    requireNumbers: policy.requireNumbers,
    requireSpecialChars: policy.requireSpecialChars,
    passwordExpiryDays: policy.passwordExpiryDays,
    rateLimitPerMinute: policy.rateLimitPerMinute,
    autoBlockAfterRequests: policy.autoBlockAfterRequests,
    autoBlockDurationMinutes: policy.autoBlockDurationMinutes,
    allowedOriginsCsv: policy.allowedOrigins.join(', '),
  };
}

function formToRequest(data: FormData): UpdateSecurityPolicyRequest {
  return {
    maxLoginAttempts: data.maxLoginAttempts,
    lockoutDurationMinutes: data.lockoutDurationMinutes,
    sessionTimeoutMinutes: data.sessionTimeoutMinutes,
    requireMfaForAdmin: data.requireMfaForAdmin,
    minPasswordLength: data.minPasswordLength,
    requireUppercase: data.requireUppercase,
    requireNumbers: data.requireNumbers,
    requireSpecialChars: data.requireSpecialChars,
    passwordExpiryDays: data.passwordExpiryDays,
    rateLimitPerMinute: data.rateLimitPerMinute,
    autoBlockAfterRequests: data.autoBlockAfterRequests,
    autoBlockDurationMinutes: data.autoBlockDurationMinutes,
    allowedOrigins: data.allowedOriginsCsv
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}

export function SecurityPolicyTab() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(AdminPermission.SECURITY_WRITE);
  const { data: policy, isLoading, isError, refetch } = useSecurityPolicy();
  const { updatePolicy } = useSecurityActions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (policy) reset(policyToForm(policy));
  }, [policy, reset]);

  if (isLoading) return <InlineLoader />;
  if (isError)
    return (
      <ErrorState
        message='Impossible de charger la politique de sécurité.'
        onRetry={refetch}
      />
    );
  if (!policy) return null;

  const onSubmit = async (data: FormData) => {
    await updatePolicy.mutateAsync(formToRequest(data));
  };

  const numericProps = (field: keyof FormData) => ({
    ...register(field),
    type: 'number',
    fullWidth: true,
    size: 'small' as const,
    disabled: !canWrite,
    error: !!errors[field],
    helperText: errors[field]?.message as string | undefined,
  });

  return (
    <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
      {!canWrite && (
        <Alert severity='info' sx={{ mb: 3 }}>
          Lecture seule — la permission <code>admin.security.write</code> est
          requise pour modifier la politique.
        </Alert>
      )}

      <Section title='Connexion'>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label='Tentatives max'
            {...numericProps('maxLoginAttempts')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label='Lockout (min)'
            {...numericProps('lockoutDurationMinutes')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label='Session timeout (min)'
            {...numericProps('sessionTimeoutMinutes')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={policy.requireMfaForAdmin}
                {...register('requireMfaForAdmin')}
                disabled={!canWrite}
              />
            }
            label='MFA obligatoire pour les admins'
          />
        </Grid>
      </Section>

      <Section title='Mot de passe'>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label='Longueur min'
            {...numericProps('minPasswordLength')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label='Expiration (jours, 0 = jamais)'
            {...numericProps('passwordExpiryDays')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={policy.requireUppercase}
                {...register('requireUppercase')}
                disabled={!canWrite}
              />
            }
            label='Majuscule requise'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={policy.requireNumbers}
                {...register('requireNumbers')}
                disabled={!canWrite}
              />
            }
            label='Chiffre requis'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={policy.requireSpecialChars}
                {...register('requireSpecialChars')}
                disabled={!canWrite}
              />
            }
            label='Caractère spécial requis'
          />
        </Grid>
      </Section>

      <Section title='Rate-limit & auto-block'>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label='Requêtes / minute'
            {...numericProps('rateLimitPerMinute')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label='Seuil auto-block'
            {...numericProps('autoBlockAfterRequests')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label='Durée auto-block (min)'
            {...numericProps('autoBlockDurationMinutes')}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label='Origines autorisées (séparées par des virgules)'
            placeholder='https://app.remindy.fr, https://admin.remindy.fr'
            multiline
            minRows={2}
            fullWidth
            size='small'
            disabled={!canWrite}
            {...register('allowedOriginsCsv')}
          />
        </Grid>
      </Section>

      {canWrite && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type='submit'
            variant='contained'
            disabled={!isDirty || updatePolicy.isPending}
          >
            Enregistrer
          </Button>
        </Box>
      )}
    </Box>
  );
}
