import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { OcrStatus } from '@/shared/domain/types';

export const OCR_STATUS_LABELS: Record<OcrStatus, string> = {
  [OcrStatus.PENDING]: 'En attente',
  [OcrStatus.PROCESSING]: 'En cours',
  [OcrStatus.COMPLETED]: 'Terminé',
  [OcrStatus.FAILED]: 'Échec',
};

const STATUS_COLORS: Record<
  OcrStatus,
  'default' | 'info' | 'success' | 'error'
> = {
  [OcrStatus.PENDING]: 'default',
  [OcrStatus.PROCESSING]: 'info',
  [OcrStatus.COMPLETED]: 'success',
  [OcrStatus.FAILED]: 'error',
};

interface Props {
  status: OcrStatus;
}

export function OcrStatusBadge({ status }: Props) {
  const isProcessing = status === OcrStatus.PROCESSING;
  return (
    <Chip
      label={OCR_STATUS_LABELS[status]}
      size='small'
      color={STATUS_COLORS[status]}
      variant={status === OcrStatus.PENDING ? 'outlined' : 'filled'}
      icon={
        isProcessing ? (
          <CircularProgress size={12} thickness={6} sx={{ color: 'inherit' }} />
        ) : undefined
      }
    />
  );
}
