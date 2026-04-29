import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { useAuditLogs } from '@/modules/audit/application/useAuditLogs';
import { ErrorState } from '@/shared/ui/NetworkStates';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import type { AuditLog, AuditLogQuery } from '@/shared/domain/types';
import { Severity } from '@/shared/domain/types';

const SEVERITY_COLORS: Record<Severity, 'info' | 'warning' | 'error'> = {
  [Severity.INFO]: 'info',
  [Severity.WARNING]: 'warning',
  [Severity.CRITICAL]: 'error',
};

function actionColor(
  action: string
): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('ban') || a.includes('revoke'))
    return 'error';
  if (a.includes('create') || a.includes('verify') || a.includes('grant'))
    return 'success';
  if (a.includes('update') || a.includes('change') || a.includes('reset'))
    return 'warning';
  if (a.includes('login') || a.includes('logout') || a.includes('view'))
    return 'info';
  return 'default';
}

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogQuery>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useAuditLogs({
    ...filters,
    search: search || undefined,
    action: actionFilter || undefined,
    severity: severityFilter || undefined,
    dateFrom: toIsoOrUndefined(dateFromInput),
    dateTo: toIsoOrUndefined(dateToInput),
  });

  const resetFilters = () => {
    setSearch('');
    setActionFilter('');
    setSeverityFilter('');
    setDateFromInput('');
    setDateToInput('');
    setFilters(f => ({ ...f, page: 1 }));
  };

  const handlePagination = useCallback((model: GridPaginationModel) => {
    setFilters(f => ({
      ...f,
      page: model.page + 1,
      limit: model.pageSize,
    }));
  }, []);

  const columns: GridColDef<AuditLog>[] = [
    {
      field: 'createdAt',
      headerName: 'Date / Heure',
      width: 170,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
    {
      field: 'actorUserId',
      headerName: 'Utilisateur',
      flex: 1,
      minWidth: 200,
      renderCell: ({ value }) =>
        value ? (
          <Typography
            variant='body2'
            fontFamily='monospace'
            sx={{ fontSize: 12 }}
          >
            {value}
          </Typography>
        ) : (
          <Chip label='Système' size='small' variant='outlined' />
        ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      renderCell: ({ value }) => (
        <Chip label={value} size='small' color={actionColor(value)} />
      ),
    },
    {
      field: 'resourceType',
      headerName: 'Ressource',
      width: 160,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant='body2'>{row.resourceType}</Typography>
          {row.resourceId && (
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ fontFamily: 'monospace' }}
              noWrap
            >
              {row.resourceId.substring(0, 8)}…
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'severity',
      headerName: 'Sévérité',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size='small'
          color={SEVERITY_COLORS[value as Severity]}
          variant='outlined'
        />
      ),
    },
    {
      field: 'success',
      headerName: 'OK',
      width: 70,
      type: 'boolean',
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Tooltip title='Voir le détail'>
          <IconButton
            size='small'
            onClick={() => setSelectedLogId(row.id)}
            aria-label={`Voir le log ${row.id}`}
          >
            <VisibilityIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message="Impossible de charger les logs d'audit."
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Audit
      </Typography>

      {/* Filters bar */}
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
          placeholder='Rechercher dans les payloads…'
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
          aria-label='Rechercher dans les logs'
        />

        <TextField
          size='small'
          label='Action'
          placeholder='ex: user.ban'
          value={actionFilter}
          onChange={e => {
            setActionFilter(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 160 }}
        />

        <TextField
          size='small'
          select
          label='Sévérité'
          value={severityFilter}
          onChange={e => {
            setSeverityFilter((e.target.value as Severity) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value=''>Toutes</MenuItem>
          <MenuItem value={Severity.INFO}>Info</MenuItem>
          <MenuItem value={Severity.WARNING}>Warning</MenuItem>
          <MenuItem value={Severity.CRITICAL}>Critical</MenuItem>
        </TextField>

        <TextField
          size='small'
          type='date'
          label='Du'
          value={dateFromInput}
          onChange={e => {
            setDateFromInput(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <TextField
          size='small'
          type='date'
          label='Au'
          value={dateToInput}
          onChange={e => {
            setDateToInput(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <Button
          size='small'
          startIcon={<RestartAltIcon />}
          onClick={resetFilters}
          sx={{ ml: 'auto' }}
        >
          Réinitialiser
        </Button>
      </Paper>

      {/* Data grid */}
      <Paper sx={{ height: 'calc(100vh - 290px)', minHeight: 400 }}>
        <DataGrid
          rows={data?.data ?? []}
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
          onRowClick={params => setSelectedLogId(params.id as string)}
          sx={{
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
          }}
          aria-label="Liste des logs d'audit"
        />
      </Paper>

      <AuditLogDetailDrawer
        logId={selectedLogId}
        open={!!selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </Box>
  );
}
