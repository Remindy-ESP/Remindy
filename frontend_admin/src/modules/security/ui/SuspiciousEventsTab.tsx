import { useState } from 'react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';
import { useSuspiciousEvents } from '@/modules/security/application/useSuspiciousEvents';
import {
  DataTablePage,
  type DataTablePagination,
} from '@/shared/ui/DataTablePage';
import { Severity, type SecurityLog } from '@/shared/domain/types';

const SEVERITY_COLORS: Record<Severity, 'info' | 'warning' | 'error'> = {
  [Severity.INFO]: 'info',
  [Severity.WARNING]: 'warning',
  [Severity.CRITICAL]: 'error',
};

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
      />
    ),
  },
  {
    field: 'eventType',
    headerName: 'Événement',
    width: 220,
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
        '—'
      ),
  },
  {
    field: 'userEmail',
    headerName: 'Utilisateur',
    flex: 1,
    minWidth: 200,
    renderCell: ({ value }) => value ?? '—',
  },
];

export function SuspiciousEventsTab() {
  const [pagination, setPagination] = useState<DataTablePagination>({
    page: 1,
    limit: 50,
  });

  const { data, isLoading, isError, refetch } = useSuspiciousEvents(pagination);

  return (
    <DataTablePage<SecurityLog>
      columns={columns}
      rows={data?.items ?? []}
      total={data?.total ?? 0}
      isLoading={isLoading}
      isError={isError}
      errorMessage='Impossible de charger les événements suspects.'
      onRetry={refetch}
      pagination={pagination}
      onPaginationChange={setPagination}
      ariaLabel='Liste des événements suspects'
    />
  );
}
