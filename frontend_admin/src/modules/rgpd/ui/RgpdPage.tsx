import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useRgpdKpi } from '@/modules/rgpd/application/useRgpdExports';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { AdminPermission } from '@/shared/domain/types';
import { ExportsList } from './ExportsList';
import { DeleteUserDataDialog } from './DeleteUserDataDialog';

type RgpdTab = 'exports' | 'deletions';

const TABS: { value: RgpdTab; label: string; permission: AdminPermission }[] = [
  {
    value: 'exports',
    label: 'Exports de données',
    permission: AdminPermission.RGPD_EXPORT,
  },
  {
    value: 'deletions',
    label: 'Suppressions de comptes',
    permission: AdminPermission.RGPD_DELETE,
  },
];

const DEFAULT_TAB: RgpdTab = 'exports';

function isRgpdTab(value: string | null): value is RgpdTab {
  return TABS.some(t => t.value === value);
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
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
          {value.toLocaleString('fr-FR')}
        </Typography>
      )}
    </Paper>
  );
}

export function RgpdPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: RgpdTab = isRgpdTab(rawTab) ? rawTab : DEFAULT_TAB;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { pending, ready } = useRgpdKpi();

  const handleChange = (_: unknown, next: RgpdTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        RGPD
      </Typography>

      <PermissionGate permission={AdminPermission.RGPD_EXPORT}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='Exports en attente'
              value={pending.data?.total ?? 0}
              loading={pending.isLoading}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label='Exports prêts'
              value={ready.data?.total ?? 0}
              loading={ready.isLoading}
            />
          </Grid>
        </Grid>
      </PermissionGate>

      <Tabs
        value={activeTab}
        onChange={handleChange}
        aria-label='Onglets RGPD'
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map(t => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      {activeTab === 'exports' && (
        <PermissionGate
          permission={AdminPermission.RGPD_EXPORT}
          fallback={
            <Alert severity='warning'>
              Permission <code>{AdminPermission.RGPD_EXPORT}</code> requise.
            </Alert>
          }
        >
          <ExportsList />
        </PermissionGate>
      )}

      {activeTab === 'deletions' && (
        <PermissionGate
          permission={AdminPermission.RGPD_DELETE}
          fallback={
            <Alert severity='warning'>
              Permission <code>{AdminPermission.RGPD_DELETE}</code> requise.
            </Alert>
          }
        >
          <Alert severity='warning' sx={{ mb: 3 }}>
            <AlertTitle>Actions destructives auditées</AlertTitle>
            Toutes les actions RGPD de suppression sont auditées au niveau{' '}
            <strong>CRITICAL</strong> et conservées 5 ans conformément à la
            réglementation.
          </Alert>

          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Anonymiser un compte
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Lance la procédure d&apos;anonymisation d&apos;un utilisateur. La
              confirmation requiert la sélection du compte, la saisie de
              l&apos;email exact et une raison de minimum 20 caractères.
            </Typography>
            <Button
              variant='contained'
              color='error'
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteOpen(true)}
            >
              Lancer l&apos;anonymisation
            </Button>
          </Paper>

          <DeleteUserDataDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
          />
        </PermissionGate>
      )}
    </Box>
  );
}
