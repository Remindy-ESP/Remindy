import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { useDashboard } from '@/modules/dashboard/application/useDashboard';
import {
  AdminPermission,
  OcrStatus,
  type AdminDocument,
} from '@/shared/domain/types';
import { DocumentsList } from './DocumentsList';
import { DocumentDetailDrawer } from './DocumentDetailDrawer';

interface StatCardProps {
  label: string;
  value: number;
  color: 'default' | 'info' | 'success' | 'error';
  selected: boolean;
  loading?: boolean;
  onClick: () => void;
}

const COLOR_TO_BG: Record<StatCardProps['color'], string> = {
  default: 'grey.100',
  info: 'info.lighter',
  success: 'success.lighter',
  error: 'error.lighter',
};

function StatCard({
  label,
  value,
  color,
  selected,
  loading,
  onClick,
}: StatCardProps) {
  return (
    <Paper
      onClick={onClick}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderLeft: 4,
        borderColor: selected
          ? `${color === 'default' ? 'grey.500' : `${color}.main`}`
          : 'transparent',
        bgcolor: selected ? COLOR_TO_BG[color] : 'background.paper',
        transition: 'all 0.15s',
        '&:hover': { bgcolor: COLOR_TO_BG[color] },
      }}
      aria-pressed={selected}
    >
      <Typography variant='caption' color='text.secondary' fontWeight={600}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={80} height={36} />
      ) : (
        <Typography variant='h5' fontWeight={700} sx={{ mt: 0.5 }}>
          {value.toLocaleString('fr-FR')}
        </Typography>
      )}
    </Paper>
  );
}

export function CloudPage() {
  const { hasPermission } = useAuth();
  const canSeeDashboard = hasPermission(AdminPermission.DASHBOARD_READ);
  const { data: dashboard, isLoading: statsLoading } = useDashboard(
    {},
    { enabled: canSeeDashboard }
  );
  const stats = dashboard?.cloud;
  const [ocrStatusFilter, setOcrStatusFilter] = useState<OcrStatus | ''>('');
  const [selected, setSelected] = useState<AdminDocument | null>(null);

  const toggleFilter = (status: OcrStatus) =>
    setOcrStatusFilter(prev => (prev === status ? '' : status));

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Cloud
      </Typography>

      {canSeeDashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='OCR en attente'
              value={stats?.ocrPending ?? 0}
              color='default'
              selected={ocrStatusFilter === OcrStatus.PENDING}
              loading={statsLoading}
              onClick={() => toggleFilter(OcrStatus.PENDING)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='OCR en cours'
              value={stats?.ocrProcessing ?? 0}
              color='info'
              selected={ocrStatusFilter === OcrStatus.PROCESSING}
              loading={statsLoading}
              onClick={() => toggleFilter(OcrStatus.PROCESSING)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='OCR terminé'
              value={stats?.ocrCompleted ?? 0}
              color='success'
              selected={ocrStatusFilter === OcrStatus.COMPLETED}
              loading={statsLoading}
              onClick={() => toggleFilter(OcrStatus.COMPLETED)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='OCR en échec'
              value={stats?.ocrFailed ?? 0}
              color='error'
              selected={ocrStatusFilter === OcrStatus.FAILED}
              loading={statsLoading}
              onClick={() => toggleFilter(OcrStatus.FAILED)}
            />
          </Grid>
        </Grid>
      )}

      <DocumentsList
        ocrStatusFilter={ocrStatusFilter}
        onOcrStatusFilterChange={setOcrStatusFilter}
        onRowClick={setSelected}
      />

      <DocumentDetailDrawer
        document={selected}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
