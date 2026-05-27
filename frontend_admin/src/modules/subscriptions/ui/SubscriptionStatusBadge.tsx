import Chip from '@mui/material/Chip';
import { SubscriptionStatus } from '@/shared/domain/types';

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: 'Actif',
  [SubscriptionStatus.PAUSED]: 'En pause',
  [SubscriptionStatus.CANCELLED]: 'Annulé',
  [SubscriptionStatus.TRIAL]: 'Essai',
};

const STATUS_COLORS: Record<
  SubscriptionStatus,
  'success' | 'warning' | 'default' | 'info'
> = {
  [SubscriptionStatus.ACTIVE]: 'success',
  [SubscriptionStatus.PAUSED]: 'warning',
  [SubscriptionStatus.CANCELLED]: 'default',
  [SubscriptionStatus.TRIAL]: 'info',
};

interface Props {
  status: SubscriptionStatus;
}

export function SubscriptionStatusBadge({ status }: Props) {
  return (
    <Chip
      label={SUBSCRIPTION_STATUS_LABELS[status]}
      size='small'
      color={STATUS_COLORS[status]}
      variant={status === SubscriptionStatus.CANCELLED ? 'outlined' : 'filled'}
    />
  );
}
