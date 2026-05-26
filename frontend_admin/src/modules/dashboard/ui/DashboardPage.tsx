import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CloudIcon from '@mui/icons-material/Cloud';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboard } from '@/modules/dashboard/application/useDashboard';
import { ErrorState } from '@/shared/ui/NetworkStates';
import type { DashboardOverview } from '@/shared/domain/types';

type ChipColor = 'success' | 'warning' | 'error' | 'info' | 'default';

interface SubMetric {
  label: string;
  value: string | number;
  chipColor?: ChipColor;
}

interface StatCardProps {
  title: string;
  icon: ReactNode;
  color: string;
  mainLabel: string;
  mainValue: string | number;
  subs?: SubMetric[];
  loading?: boolean;
}

function StatCard({
  title,
  icon,
  color,
  mainLabel,
  mainValue,
  subs = [],
  loading = false,
}: StatCardProps) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          {icon}
        </Box>
        <Typography variant='subtitle2' color='text.secondary'>
          {title}
        </Typography>
      </Box>

      <Box sx={{ mb: subs.length ? 2 : 0 }}>
        <Typography variant='caption' color='text.secondary'>
          {mainLabel}
        </Typography>
        {loading ? (
          <Skeleton variant='text' width={80} height={40} />
        ) : (
          <Typography variant='h4' fontWeight={700}>
            {mainValue}
          </Typography>
        )}
      </Box>

      {subs.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {subs.map(sub => (
            <Box
              key={sub.label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                {sub.label}
              </Typography>
              {loading ? (
                <Skeleton variant='text' width={36} />
              ) : (
                <Chip
                  size='small'
                  label={sub.value}
                  color={sub.chipColor ?? 'default'}
                  variant={sub.chipColor ? 'filled' : 'outlined'}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

function buildUserSubs(overview?: DashboardOverview): SubMetric[] {
  if (!overview) return [];
  return [
    { label: 'Actifs 7j', value: overview.users.active7d, chipColor: 'success' },
    {
      label: 'Bannis',
      value: overview.users.banned,
      chipColor: overview.users.banned > 0 ? 'error' : 'default',
    },
  ];
}

function buildSecuritySubs(overview?: DashboardOverview): SubMetric[] {
  if (!overview) return [];
  const { critical24h, activeBlockedIps } = overview.security;
  return [
    {
      label: 'Critique 24h',
      value: critical24h,
      chipColor: critical24h > 0 ? 'error' : 'default',
    },
    {
      label: 'IPs bloquées',
      value: activeBlockedIps,
      chipColor: activeBlockedIps > 0 ? 'warning' : 'default',
    },
  ];
}

function buildSubscriptionSubs(overview?: DashboardOverview): SubMetric[] {
  if (!overview) return [];
  return [
    {
      label: 'MRR estimé',
      value: `${overview.subscriptions.estimatedMrr.toFixed(0)} €`,
      chipColor: 'info',
    },
    {
      label: 'Échéance 7j',
      value: overview.subscriptions.expiringIn7d,
      chipColor:
        overview.subscriptions.expiringIn7d > 0 ? 'warning' : 'default',
    },
  ];
}

const FREQUENCY_LABELS: Record<string, string> = {
  'one-time': 'Ponctuel',
  weekly: 'Hebdo',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
};

const FREQUENCY_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
];

const OCR_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
};

interface ChartPanelProps {
  title: string;
  loading: boolean;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

function ChartPanel({
  title,
  loading,
  empty,
  emptyMessage,
  children,
}: ChartPanelProps) {
  return (
    <Paper sx={{ p: 3, height: 340, display: 'flex', flexDirection: 'column' }}>
      <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <Skeleton variant='rectangular' height='100%' />
        ) : empty ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant='body2'>{emptyMessage}</Typography>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Paper>
  );
}

function buildFrequencyData(overview?: DashboardOverview) {
  if (!overview) return [];
  return Object.entries(overview.subscriptions.byFrequency)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: FREQUENCY_LABELS[key] ?? key,
      value: count,
      key,
    }));
}

function buildOcrData(overview?: DashboardOverview) {
  if (!overview) return [];
  return [
    { name: 'En attente', key: 'pending', value: overview.cloud.ocrPending },
    {
      name: 'En cours',
      key: 'processing',
      value: overview.cloud.ocrProcessing,
    },
    { name: 'Terminés', key: 'completed', value: overview.cloud.ocrCompleted },
    { name: 'Échoués', key: 'failed', value: overview.cloud.ocrFailed },
  ];
}

function buildCloudSubs(overview?: DashboardOverview): SubMetric[] {
  if (!overview) return [];
  return [
    {
      label: 'OCR en attente',
      value: overview.cloud.ocrPending + overview.cloud.ocrProcessing,
      chipColor:
        overview.cloud.ocrPending + overview.cloud.ocrProcessing > 0
          ? 'warning'
          : 'default',
    },
    { label: 'Stockage', value: overview.cloud.totalStorageFormatted },
  ];
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isError) {
    return (
      <ErrorState
        message='Impossible de charger le dashboard.'
        onRetry={refetch}
      />
    );
  }

  const frequencyData = buildFrequencyData(data);
  const ocrData = buildOcrData(data);
  const ocrHasValues = ocrData.some(d => d.value > 0);

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title='Utilisateurs'
            icon={<PeopleIcon />}
            color='#6366f1'
            mainLabel='Total'
            mainValue={data?.users.total ?? 0}
            subs={buildUserSubs(data)}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title='Sécurité'
            icon={<SecurityIcon />}
            color='#10b981'
            mainLabel='Suspects 24h'
            mainValue={data?.security.suspicious24h ?? 0}
            subs={buildSecuritySubs(data)}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title='Abonnements'
            icon={<SubscriptionsIcon />}
            color='#f59e0b'
            mainLabel='Actifs'
            mainValue={data?.subscriptions.active ?? 0}
            subs={buildSubscriptionSubs(data)}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title='Cloud'
            icon={<CloudIcon />}
            color='#3b82f6'
            mainLabel='Documents'
            mainValue={data?.cloud.totalDocuments ?? 0}
            subs={buildCloudSubs(data)}
            loading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartPanel
            title='Abonnements par fréquence'
            loading={isLoading}
            empty={frequencyData.length === 0}
            emptyMessage='Aucun abonnement actif.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={frequencyData}
                  dataKey='value'
                  nameKey='name'
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {frequencyData.map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={
                        FREQUENCY_COLORS[index % FREQUENCY_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartPanel
            title='OCR — répartition des statuts'
            loading={isLoading}
            empty={!ocrHasValues}
            emptyMessage='Aucun document indexé.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={ocrData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='value'>
                  {ocrData.map(entry => (
                    <Cell key={entry.key} fill={OCR_COLORS[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </Grid>
      </Grid>
    </Box>
  );
}
