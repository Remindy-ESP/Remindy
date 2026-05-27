import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { useRgpdExports } from '@/modules/rgpd/application/useRgpdExports';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { ErrorState } from '@/shared/ui/NetworkStates';
import { RgpdStatusBadge, RGPD_STATUS_LABELS } from './RgpdStatusBadge';
import { RequestExportDialog } from './RequestExportDialog';
import {
  AdminPermission,
  RgpdExportStatus,
  type RgpdExport,
  type RgpdExportQuery,
  type RgpdExportRequestedBy,
} from '@/shared/domain/types';

const REQUESTED_BY_OPTIONS: { value: RgpdExportRequestedBy; label: string }[] =
  [
    { value: 'user', label: 'Utilisateur' },
    { value: 'admin', label: 'Admin' },
    { value: 'automated', label: 'Automatisé' },
  ];

function formatBytes(bytes: number | null) {
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

export function ExportsList() {
  const [filters, setFilters] = useState<RgpdExportQuery>({
    page: 1,
    limit: 25,
  });
  const [statusFilter, setStatusFilter] = useState<RgpdExportStatus | ''>('');
  const [requestedByFilter, setRequestedByFilter] = useState<
    RgpdExportRequestedBy | ''
  >('');
  const [requestOpen, setRequestOpen] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useRgpdExports({
    ...filters,
    status: statusFilter || undefined,
    requestedBy: requestedByFilter || undefined,
  });

  const resetFilters = () => {
    setStatusFilter('');
    setRequestedByFilter('');
    setFilters(f => ({ ...f, page: 1 }));
  };

  const handlePagination = useCallback((model: GridPaginationModel) => {
    setFilters(f => ({ ...f, page: model.page + 1, limit: model.pageSize }));
  }, []);

  const columns: GridColDef<RgpdExport>[] = [
    {
      field: 'userId',
      headerName: 'Utilisateur',
      width: 280,
      renderCell: ({ value }) => (
        <Typography variant='body2' fontFamily='monospace' fontSize={12}>
          {value as string}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 110,
      renderCell: ({ value }) => (
        <RgpdStatusBadge status={value as RgpdExportStatus} />
      ),
    },
    {
      field: 'requestedBy',
      headerName: 'Demandé par',
      width: 130,
      renderCell: ({ value }) => {
        const label =
          REQUESTED_BY_OPTIONS.find(o => o.value === value)?.label ??
          (value as string);
        return <Typography variant='body2'>{label}</Typography>;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Demandé le',
      width: 160,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
    {
      field: 'completedAt',
      headerName: 'Prêt le',
      width: 160,
      valueFormatter: (value: string | null) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
    {
      field: 'expiresAt',
      headerName: 'Expire le',
      width: 160,
      valueFormatter: (value: string | null) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
    {
      field: 'fileSize',
      headerName: 'Taille',
      width: 100,
      renderCell: ({ value }) => formatBytes(value as number | null),
    },
    {
      field: 'download',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        row.status === RgpdExportStatus.COMPLETED && row.signedUrl ? (
          <Tooltip title="Télécharger l'export">
            <IconButton
              size='small'
              component='a'
              href={row.signedUrl}
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Télécharger'
            >
              <DownloadIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        ) : null,
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message='Impossible de charger les exports RGPD.'
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          size='small'
          select
          label='Statut'
          value={statusFilter}
          onChange={e => {
            setStatusFilter((e.target.value as RgpdExportStatus) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          {Object.values(RgpdExportStatus).map(s => (
            <MenuItem key={s} value={s}>
              {RGPD_STATUS_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          select
          label='Demandé par'
          value={requestedByFilter}
          onChange={e => {
            setRequestedByFilter(
              (e.target.value as RgpdExportRequestedBy) || ''
            );
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          {REQUESTED_BY_OPTIONS.map(o => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <Button
          size='small'
          startIcon={<RestartAltIcon />}
          onClick={resetFilters}
        >
          Réinitialiser
        </Button>

        <PermissionGate permission={AdminPermission.RGPD_EXPORT}>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setRequestOpen(true)}
            sx={{ ml: 'auto' }}
          >
            Demander un export
          </Button>
        </PermissionGate>
      </Paper>

      <Paper sx={{ height: 'calc(100vh - 380px)', minHeight: 400 }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          rowCount={data?.total ?? 0}
          loading={isLoading || isFetching}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationMode='server'
          paginationModel={{
            page: (filters.page ?? 1) - 1,
            pageSize: filters.limit ?? 25,
          }}
          onPaginationModelChange={handlePagination}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          aria-label='Liste des exports RGPD'
        />
      </Paper>

      <RequestExportDialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </Box>
  );
}
