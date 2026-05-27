import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { useDashboard } from '@/modules/dashboard/application/useDashboard';
import { AdminPermission, type Subscription } from '@/shared/domain/types';
import { SubscriptionsList } from './SubscriptionsList';
import { SubscriptionDetailDrawer } from './SubscriptionDetailDrawer';

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string | number;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={600}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={80} height={36} />
      ) : (
        <Typography variant='h5' fontWeight={700} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      )}
      {hint && (
        <Typography variant='caption' color='text.secondary'>
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

function formatEur(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SubscriptionsPage() {
  const { hasPermission } = useAuth();
  const canSeeDashboard = hasPermission(AdminPermission.DASHBOARD_READ);
  const { data: dashboard, isLoading: statsLoading } = useDashboard(
    {},
    { enabled: canSeeDashboard }
  );
  const stats = dashboard?.subscriptions;
  const [selected, setSelected] = useState<Subscription | null>(null);

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Abonnements
      </Typography>

      {canSeeDashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='Actifs'
              value={stats?.active ?? 0}
              loading={statsLoading}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='Inactifs'
              value={stats?.inactive ?? 0}
              loading={statsLoading}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='Expirent < 7j'
              value={stats?.expiringIn7d ?? 0}
              loading={statsLoading}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='MRR estimé'
              value={formatEur(stats?.estimatedMrr ?? 0)}
              hint='Revenus mensuels équivalents'
              loading={statsLoading}
            />
          </Grid>
        </Grid>
      )}

      <SubscriptionsList onRowClick={setSelected} />

      <SubscriptionDetailDrawer
        subscription={selected}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
