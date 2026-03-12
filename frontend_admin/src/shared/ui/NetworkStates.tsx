import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

export function FullPageLoader() {
    return (
        <Box
            role="status"
            aria-label="Chargement"
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
            }}
        >
            <CircularProgress size={48} />
        </Box>
    );
}

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({
    message = 'Une erreur est survenue.',
    onRetry,
}: ErrorStateProps) {
    return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <Alert
                severity="error"
                role="alert"
                action={
                    onRetry ? (
                        <Button color="inherit" size="small" onClick={onRetry}>
                            Réessayer
                        </Button>
                    ) : undefined
                }
            >
                {message}
            </Alert>
        </Box>
    );
}

export function EmptyState({ message }: { message: string }) {
    return (
        <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">{message}</Typography>
        </Box>
    );
}

export function InlineLoader() {
    return (
        <Box
            role="status"
            aria-label="Chargement"
            sx={{ display: 'flex', justifyContent: 'center', p: 4 }}
        >
            <CircularProgress size={32} />
        </Box>
    );
}
