import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const TITLES: Record<string, string> = {
    ban: 'Bannir l\'utilisateur',
    unban: 'Débannir l\'utilisateur',
    resetPassword: 'Réinitialiser le mot de passe',
    verifyEmail: 'Vérifier l\'email',
    forceMfa: 'Forcer l\'activation MFA',
    revokeSessions: 'Révoquer toutes les sessions',
};

const DESCRIPTIONS: Record<string, string> = {
    ban: 'L\'utilisateur ne pourra plus se connecter.',
    unban: 'L\'utilisateur pourra à nouveau se connecter.',
    resetPassword: 'L\'utilisateur devra définir un nouveau mot de passe.',
    verifyEmail: 'L\'email sera marqué comme vérifié.',
    forceMfa: 'L\'utilisateur devra configurer la double authentification.',
    revokeSessions: 'Toutes les sessions actives seront terminées.',
};

interface Props {
    open: boolean;
    type: string;
    userEmail: string;
    onConfirm: (reason?: string) => void;
    onCancel: () => void;
}

export function UserActionDialog({ open, type, userEmail, onConfirm, onCancel }: Props) {
    const [reason, setReason] = useState('');
    const needsReason = type === 'ban';

    const handleConfirm = () => {
        onConfirm(needsReason ? reason : undefined);
        setReason('');
    };

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            aria-labelledby="action-dialog-title"
        >
            <DialogTitle id="action-dialog-title">{TITLES[type] || 'Confirmer'}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {DESCRIPTIONS[type]} Cible : <strong>{userEmail}</strong>
                </DialogContentText>
                {needsReason && (
                    <TextField
                        label="Raison (optionnel)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mt: 2 }}
                        inputProps={{ maxLength: 500 }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Annuler</Button>
                <Button
                    variant="contained"
                    color={type === 'ban' ? 'error' : 'primary'}
                    onClick={handleConfirm}
                >
                    Confirmer
                </Button>
            </DialogActions>
        </Dialog>
    );
}
