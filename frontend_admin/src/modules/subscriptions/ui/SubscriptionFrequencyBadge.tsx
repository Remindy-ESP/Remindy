import Chip from '@mui/material/Chip';
import type { SubscriptionPlan } from '@/shared/domain/types';

export const SUBSCRIPTION_FREQUENCY_LABELS: Record<SubscriptionPlan, string> = {
  'one-time': 'Ponctuel',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
};

interface Props {
  frequency: SubscriptionPlan;
}

export function SubscriptionFrequencyBadge({ frequency }: Props) {
  return (
    <Chip
      label={SUBSCRIPTION_FREQUENCY_LABELS[frequency]}
      size='small'
      variant='outlined'
    />
  );
}
