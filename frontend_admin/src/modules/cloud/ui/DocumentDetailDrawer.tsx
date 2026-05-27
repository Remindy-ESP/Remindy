import { useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import {
  AdminPermission,
  OcrStatus,
  type AdminDocument,
} from '@/shared/domain/types';
import { OcrStatusBadge } from './OcrStatusBadge';
import { ReprocessOcrDialog } from './ReprocessOcrDialog';

const DRAWER_WIDTH = 480;

function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let value = Number(bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('fr-FR') : '—';
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        py: 1.2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ width: 140, flexShrink: 0, fontWeight: 600, alignSelf: 'center' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{value}</Box>
    </Box>
  );
}

interface Props {
  document: AdminDocument | null;
  onClose: () => void;
}

export function DocumentDetailDrawer({ document, onClose }: Props) {
  const [reprocessOpen, setReprocessOpen] = useState(false);

  const hasParsed =
    document &&
    (document.parsedProvider ||
      document.parsedAmount !== null ||
      document.parsedDate ||
      document.parsedCategory);

  return (
    <>
      <Drawer
        anchor='right'
        open={!!document}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: DRAWER_WIDTH } } }}
      >
        {document && (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                gap: 1,
              }}
            >
              <Typography
                variant='h6'
                fontWeight={700}
                sx={{ wordBreak: 'break-word' }}
              >
                {document.filename}
              </Typography>
              <IconButton onClick={onClose} aria-label='Fermer'>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <OcrStatusBadge status={document.ocrStatus} />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Field
              label='ID'
              value={
                <Typography variant='body2' fontFamily='monospace'>
                  {document.id}
                </Typography>
              }
            />
            <Field
              label='Utilisateur'
              value={
                <Link
                  component={RouterLink}
                  to={`/users/${document.userId}`}
                  variant='body2'
                >
                  {document.userId}
                </Link>
              }
            />
            <Field label='Type MIME' value={document.mimeType} />
            <Field label='Taille' value={formatBytes(document.fileSize)} />
            <Field
              label='Hash'
              value={
                <Typography
                  variant='caption'
                  fontFamily='monospace'
                  sx={{ wordBreak: 'break-all' }}
                >
                  {document.fileHash}
                </Typography>
              }
            />
            <Field
              label='R2 key'
              value={
                <Typography
                  variant='caption'
                  fontFamily='monospace'
                  sx={{ wordBreak: 'break-all' }}
                >
                  {document.r2Bucket}/{document.r2Key}
                </Typography>
              }
            />
            <Field label='Uploadé le' value={formatDate(document.uploadedAt)} />
            <Field label='Modifié le' value={formatDate(document.updatedAt)} />

            {document.ocrStatus === OcrStatus.FAILED && document.ocrError && (
              <Alert severity='error' sx={{ mt: 2 }}>
                <Typography variant='body2' fontWeight={600}>
                  Erreur OCR
                </Typography>
                <Typography
                  variant='caption'
                  sx={{ whiteSpace: 'pre-wrap', display: 'block', mt: 0.5 }}
                >
                  {document.ocrError}
                </Typography>
              </Alert>
            )}

            {document.ocrStatus === OcrStatus.COMPLETED && document.ocrText && (
              <Accordion sx={{ mt: 2 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant='subtitle2'>
                    Texte extrait ({document.ocrText.length} caractères)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant='body2'
                    component='pre'
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      maxHeight: 320,
                      overflow: 'auto',
                      m: 0,
                    }}
                  >
                    {document.ocrText}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {hasParsed && (
              <Accordion sx={{ mt: 2 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant='subtitle2'>
                    Champs extraits (Gemini)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {document.parsedProvider && (
                    <Field
                      label='Fournisseur'
                      value={document.parsedProvider}
                    />
                  )}
                  {document.parsedAmount !== null && (
                    <Field
                      label='Montant'
                      value={`${document.parsedAmount} ${document.parsedCurrency ?? ''}`.trim()}
                    />
                  )}
                  {document.parsedDate && (
                    <Field
                      label='Date'
                      value={new Date(document.parsedDate).toLocaleDateString(
                        'fr-FR'
                      )}
                    />
                  )}
                  {document.parsedFrequency && (
                    <Field label='Fréquence' value={document.parsedFrequency} />
                  )}
                  {document.parsedCategory && (
                    <Field label='Catégorie' value={document.parsedCategory} />
                  )}
                  {document.parsingConfidence !== null && (
                    <Field
                      label='Confiance'
                      value={`${Math.round((document.parsingConfidence ?? 0) * 100)} %`}
                    />
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            <PermissionGate permission={AdminPermission.CLOUD_WRITE}>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant='contained'
                  startIcon={<ReplayIcon />}
                  onClick={() => setReprocessOpen(true)}
                  fullWidth
                  disabled={document.ocrStatus === OcrStatus.PROCESSING}
                >
                  Relancer l&apos;OCR
                </Button>
              </Box>
            </PermissionGate>
          </Box>
        )}
      </Drawer>

      {document && (
        <ReprocessOcrDialog
          document={document}
          open={reprocessOpen}
          onClose={() => setReprocessOpen(false)}
        />
      )}
    </>
  );
}
