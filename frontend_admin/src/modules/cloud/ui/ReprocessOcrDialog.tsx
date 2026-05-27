import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import { useDocumentActions } from '@/modules/cloud/application/useDocumentActions';
import type { AdminDocument } from '@/shared/domain/types';

interface Props {
  document: AdminDocument;
  open: boolean;
  onClose: () => void;
}

export function ReprocessOcrDialog({ document, open, onClose }: Props) {
  const { reprocessOcr } = useDocumentActions();
  const [force, setForce] = useState(false);

  const handleConfirm = async () => {
    await reprocessOcr.mutateAsync({ id: document.id, body: { force } });
    setForce(false);
    onClose();
  };

  const handleClose = () => {
    setForce(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Relancer l&apos;OCR</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Relancer l&apos;extraction OCR pour le document{' '}
          <strong>{document.filename}</strong> ?
        </DialogContentText>
        <FormControlLabel
          control={
            <Checkbox
              checked={force}
              onChange={e => setForce(e.target.checked)}
            />
          }
          label='Forcer le retraitement (même si déjà réussi)'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={reprocessOcr.isPending}>
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          variant='contained'
          disabled={reprocessOcr.isPending}
        >
          Lancer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
