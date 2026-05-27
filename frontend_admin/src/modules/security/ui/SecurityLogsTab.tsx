import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { GridColDef } from '@mui/x-data-grid';
import { useSecurityLogs } from '@/modules/security/application/useSecurityLogs';
import {
  DataTablePage,
  type DataTablePagination,
} from '@/shared/ui/DataTablePage';
import {
  SecurityEventType,
  Severity,
  type SecurityLog,
  type SecurityLogQuery,
} from '@/shared/domain/types';

const SEVERITY_COLORS: Record<Severity, 'info' | 'warning' | 'error'> = {
  [Severity.INFO]: 'info',
  [Severity.WARNING]: 'warning',
  [Severity.CRITICAL]: 'error',
};

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const columns: GridColDef<SecurityLog>[] = [
  {
    field: 'createdAt',
    headerName: 'Date / Heure',
    width: 170,
    valueFormatter: (value: string) =>
      value ? new Date(value).toLocaleString('fr-FR') : '—',
  },
  {
    field: 'severity',
    headerName: 'Sévérité',
    width: 110,
    renderCell: ({ value }) => (
      <Chip
        label={value}
        size='small'
        color={SEVERITY_COLORS[value as Severity] ?? 'default'}
        variant='outlined'
      />
    ),
  },
  {
    field: 'eventType',
    headerName: 'Événement',
    width: 200,
    renderCell: ({ value }) => (
      <Chip
        label={value}
        size='small'
        variant='outlined'
        sx={{ fontFamily: 'monospace', fontSize: 11 }}
      />
    ),
  },
  {
    field: 'ipAddress',
    headerName: 'IP',
    width: 140,
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
        <Typography variant='caption' color='text.secondary'>
          —
        </Typography>
      ),
  },
  {
    field: 'userEmail',
    headerName: 'Utilisateur',
    flex: 1,
    minWidth: 200,
    renderCell: ({ value }) => value ?? '—',
  },
  {
    field: 'isSuspicious',
    headerName: 'Suspect',
    width: 100,
    type: 'boolean',
  },
];

export function SecurityLogsTab() {
  const [pagination, setPagination] = useState<DataTablePagination>({
    page: 1,
    limit: 50,
  });
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [eventType, setEventType] = useState<SecurityEventType | ''>('');
  const [ipAddress, setIpAddress] = useState('');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');

  const query: SecurityLogQuery = {
    page: pagination.page,
    limit: pagination.limit,
    severity: severity || undefined,
    eventType: eventType || undefined,
    ipAddress: ipAddress || undefined,
    from: toIsoOrUndefined(fromInput),
    to: toIsoOrUndefined(toInput),
  };

  const { data, isLoading, isError, refetch } = useSecurityLogs(query);

  const resetFilters = () => {
    setSeverity('');
    setEventType('');
    setIpAddress('');
    setFromInput('');
    setToInput('');
    setPagination(p => ({ ...p, page: 1 }));
  };

  const onFilterChange = () => setPagination(p => ({ ...p, page: 1 }));

  const filters = (
    <>
      <TextField
        size='small'
        select
        label='Sévérité'
        value={severity}
        onChange={e => {
          setSeverity((e.target.value as Severity) || '');
          onFilterChange();
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
        select
        label='Événement'
        value={eventType}
        onChange={e => {
          setEventType((e.target.value as SecurityEventType) || '');
          onFilterChange();
        }}
        sx={{ minWidth: 220 }}
      >
        <MenuItem value=''>Tous</MenuItem>
        {Object.values(SecurityEventType).map(t => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size='small'
        label='IP'
        placeholder='192.168.1.1'
        value={ipAddress}
        onChange={e => {
          setIpAddress(e.target.value);
          onFilterChange();
        }}
        sx={{ minWidth: 160 }}
      />

      <TextField
        size='small'
        type='date'
        label='Du'
        value={fromInput}
        onChange={e => {
          setFromInput(e.target.value);
          onFilterChange();
        }}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        size='small'
        type='date'
        label='Au'
        value={toInput}
        onChange={e => {
          setToInput(e.target.value);
          onFilterChange();
        }}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      <Box sx={{ ml: 'auto' }}>
        <Button
          size='small'
          startIcon={<RestartAltIcon />}
          onClick={resetFilters}
        >
          Réinitialiser
        </Button>
      </Box>
    </>
  );

  return (
    <DataTablePage<SecurityLog>
      filters={filters}
      columns={columns}
      rows={data?.items ?? []}
      total={data?.total ?? 0}
      isLoading={isLoading}
      isError={isError}
      errorMessage='Impossible de charger les logs de sécurité.'
      onRetry={refetch}
      pagination={pagination}
      onPaginationChange={setPagination}
      ariaLabel='Liste des logs de sécurité'
    />
  );
}
