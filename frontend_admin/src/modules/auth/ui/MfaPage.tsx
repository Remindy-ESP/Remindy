import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/modules/auth/application/AuthContext';

export function MfaPage() {
  const { needsMfaSetup, setupMfa, enableMfa, verifyMfa, logout } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setupCalled = useRef(false);

  useEffect(() => {
    if (needsMfaSetup && !setupCalled.current) {
      setupCalled.current = true;
      setupMfa()
        .then(data => setQrCode(data.qrCodeDataUrl))
        .catch(() => setError('Impossible de générer le QR code'));
    }
  }, [needsMfaSetup, setupMfa]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (needsMfaSetup) {
        await enableMfa(code);
      } else {
        await verifyMfa(code);
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Code invalide';
      setError(message);
    } finally {
      setLoading(false);
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
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h5' gutterBottom>
            {needsMfaSetup
              ? "Configurer l'authentification MFA"
              : 'Vérification MFA'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            {needsMfaSetup
              ? "Scannez le QR code avec votre application d'authentification, puis entrez le code."
              : "Entrez le code de votre application d'authentification."}
          </Typography>

          {qrCode && (
            <Box sx={{ mb: 3 }}>
              <img
                src={qrCode}
                alt='QR code pour MFA'
                width={200}
                height={200}
                style={{ borderRadius: 8 }}
              />
            </Box>
          )}

          {error && (
            <Alert severity='error' sx={{ mb: 2 }} role='alert'>
              {error}
            </Alert>
          )}

          <Box
            component='form'
            onSubmit={handleSubmit}
            aria-label='Formulaire MFA'
          >
            <TextField
              value={code}
              onChange={e =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              label='Code à 6 chiffres'
              inputProps={{
                maxLength: 6,
                inputMode: 'numeric',
                pattern: '[0-9]*',
                autoComplete: 'one-time-code',
              }}
              fullWidth
              autoFocus
              sx={{ mb: 2 }}
            />
            <Button
              type='submit'
              variant='contained'
              fullWidth
              size='large'
              disabled={code.length !== 6 || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Vérifier'}
            </Button>
          </Box>
          <Button
            variant='text'
            fullWidth
            size='small'
            onClick={logout}
            sx={{ mt: 2, color: 'text.secondary' }}
          >
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
