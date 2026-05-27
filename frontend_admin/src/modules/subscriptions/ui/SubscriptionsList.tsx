import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { useSubscriptions } from '@/modules/subscriptions/application/useSubscriptions';
import { ErrorState } from '@/shared/ui/NetworkStates';
import {
  SubscriptionStatusBadge,
  SUBSCRIPTION_STATUS_LABELS,
} from './SubscriptionStatusBadge';
import {
  SubscriptionFrequencyBadge,
  SUBSCRIPTION_FREQUENCY_LABELS,
} from './SubscriptionFrequencyBadge';
import {
  SubscriptionStatus,
  type AdminSubscriptionsQuery,
  type Subscription,
  type SubscriptionPlan,
} from '@/shared/domain/types';

const FREQUENCIES: SubscriptionPlan[] = [
  'one-time',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

interface Props {
  onRowClick: (sub: Subscription) => void;
}

export function SubscriptionsList({ onRowClick }: Props) {
  const [filters, setFilters] = useState<AdminSubscriptionsQuery>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortDir: 'DESC',
  });
  const [name, setName] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [frequencyFilter, setFrequencyFilter] = useState<SubscriptionPlan | ''>(
    ''
  );
  const [currency, setCurrency] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useSubscriptions({
    ...filters,
    name: name || undefined,
    status: statusFilter || undefined,
    frequency: frequencyFilter || undefined,
    currency: currency || undefined,
    amountMin: amountMin ? Number(amountMin) : undefined,
    amountMax: amountMax ? Number(amountMax) : undefined,
  });

  const resetFilters = () => {
    setName('');
    setStatusFilter('');
    setFrequencyFilter('');
    setCurrency('');
    setAmountMin('');
    setAmountMax('');
    setFilters(f => ({ ...f, page: 1 }));
  };

  const handlePagination = useCallback((model: GridPaginationModel) => {
    setFilters(f => ({ ...f, page: model.page + 1, limit: model.pageSize }));
  }, []);

  const columns: GridColDef<Subscription>[] = [
    {
      field: 'name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 180,
    },
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
      field: 'amount',
      headerName: 'Montant',
      width: 130,
      renderCell: ({ row }) => formatMoney(Number(row.amount), row.currency),
    },
    {
      field: 'frequency',
      headerName: 'Fréquence',
      width: 140,
      renderCell: ({ value }) => (
        <SubscriptionFrequencyBadge frequency={value as SubscriptionPlan} />
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 110,
      renderCell: ({ value }) => (
        <SubscriptionStatusBadge status={value as SubscriptionStatus} />
      ),
    },
    {
      field: 'startDate',
      headerName: 'Début',
      width: 120,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleDateString('fr-FR') : '—',
    },
    {
      field: 'nextDueDate',
      headerName: 'Prochaine échéance',
      width: 160,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleDateString('fr-FR') : '—',
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message='Impossible de charger les abonnements.'
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
          placeholder='Rechercher par nom…'
          value={name}
          onChange={e => {
            setName(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
          aria-label='Rechercher des abonnements'
        />

        <TextField
          size='small'
          select
          label='Statut'
          value={statusFilter}
          onChange={e => {
            setStatusFilter((e.target.value as SubscriptionStatus) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          {Object.values(SubscriptionStatus).map(s => (
            <MenuItem key={s} value={s}>
              {SUBSCRIPTION_STATUS_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          select
          label='Fréquence'
          value={frequencyFilter}
          onChange={e => {
            setFrequencyFilter((e.target.value as SubscriptionPlan) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value=''>Toutes</MenuItem>
          {FREQUENCIES.map(f => (
            <MenuItem key={f} value={f}>
              {SUBSCRIPTION_FREQUENCY_LABELS[f]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          label='Devise'
          placeholder='EUR'
          value={currency}
          onChange={e => {
            setCurrency(e.target.value.toUpperCase().slice(0, 3));
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 100 }}
          inputProps={{ maxLength: 3 }}
        />

        <TextField
          size='small'
          label='Min'
          type='number'
          value={amountMin}
          onChange={e => {
            setAmountMin(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ width: 110 }}
        />

        <TextField
          size='small'
          label='Max'
          type='number'
          value={amountMax}
          onChange={e => {
            setAmountMax(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ width: 110 }}
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
          onRowClick={params => onRowClick(params.row as Subscription)}
          sx={{ '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          aria-label='Liste des abonnements'
        />
      </Paper>
    </Box>
  );
}
