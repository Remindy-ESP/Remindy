import Chip from '@mui/material/Chip';
import { RgpdExportStatus } from '@/shared/domain/types';

export const RGPD_STATUS_LABELS: Record<RgpdExportStatus, string> = {
  [RgpdExportStatus.PENDING]: 'En attente',
  [RgpdExportStatus.PROCESSING]: 'En cours',
  [RgpdExportStatus.COMPLETED]: 'Prêt',
  [RgpdExportStatus.FAILED]: 'Échec',
  [RgpdExportStatus.EXPIRED]: 'Expiré',
};

const STATUS_COLORS: Record<
  RgpdExportStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  [RgpdExportStatus.PENDING]: 'default',
  [RgpdExportStatus.PROCESSING]: 'info',
  [RgpdExportStatus.COMPLETED]: 'success',
  [RgpdExportStatus.FAILED]: 'error',
  [RgpdExportStatus.EXPIRED]: 'warning',
};

interface Props {
  status: RgpdExportStatus;
}

export function RgpdStatusBadge({ status }: Props) {
  return (
    <Chip
      label={RGPD_STATUS_LABELS[status]}
      size='small'
      color={STATUS_COLORS[status]}
      variant={status === RgpdExportStatus.PENDING ? 'outlined' : 'filled'}
    />
  );
}
