import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/modules/auth/application/AuthContext';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe requis (min. 8 caractères)'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 22,
                mb: 2,
              }}
            >
              R
            </Box>
            <Typography variant='h5'>Remindy Admin</Typography>
            <Typography variant='body2' color='text.secondary'>
              Connectez-vous pour accéder au panel
            </Typography>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }} role='alert'>
              {error}
            </Alert>
          )}

          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label='Formulaire de connexion'
          >
            <TextField
              {...register('email')}
              label='Email'
              type='email'
              autoComplete='email'
              fullWidth
              margin='normal'
              error={!!errors.email}
              helperText={errors.email?.message}
              autoFocus
            />
            <TextField
              {...register('password')}
              label='Mot de passe'
              type='password'
              autoComplete='current-password'
              fullWidth
              margin='normal'
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type='submit'
              variant='contained'
              fullWidth
              size='large'
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
