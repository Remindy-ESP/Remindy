import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAdminTickets } from '@/modules/support/application/useAdminTickets';
import { ErrorState } from '@/shared/ui/NetworkStates';
import type { AdminTicketsQuery, SupportTicket } from '@/shared/domain/types';
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
} from '@/shared/domain/types';
import { STATUS_LABELS, STATUS_COLORS } from './ticketStatusMeta';

const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.LOW]: 'Faible',
  [SupportTicketPriority.MEDIUM]: 'Moyen',
  [SupportTicketPriority.HIGH]: 'Élevé',
  [SupportTicketPriority.URGENT]: 'Urgent',
};

const PRIORITY_COLORS: Record<
  SupportTicketPriority,
  'default' | 'info' | 'warning' | 'error'
> = {
  [SupportTicketPriority.LOW]: 'default',
  [SupportTicketPriority.MEDIUM]: 'info',
  [SupportTicketPriority.HIGH]: 'warning',
  [SupportTicketPriority.URGENT]: 'error',
};

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  [SupportTicketCategory.TECHNICAL]: 'Technique',
  [SupportTicketCategory.BILLING]: 'Facturation',
  [SupportTicketCategory.ACCOUNT]: 'Compte',
  [SupportTicketCategory.SUBSCRIPTION]: 'Abonnement',
  [SupportTicketCategory.BUG]: 'Bug',
  [SupportTicketCategory.FEATURE_REQUEST]: 'Fonctionnalité',
  [SupportTicketCategory.OTHER]: 'Autre',
};

export function TicketListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AdminTicketsQuery>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortDir: 'DESC',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>(
    ''
  );
  const [priorityFilter, setPriorityFilter] = useState<
    SupportTicketPriority | ''
  >('');
  const [categoryFilter, setCategoryFilter] = useState<
    SupportTicketCategory | ''
  >('');

  const { data, isLoading, isError, refetch, isFetching } = useAdminTickets({
    ...filters,
    q: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
  });

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setFilters(f => ({ ...f, page: 1 }));
  };

  const handlePagination = useCallback((model: GridPaginationModel) => {
    setFilters(f => ({ ...f, page: model.page + 1, limit: model.pageSize }));
  }, []);

  const columns: GridColDef<SupportTicket>[] = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 160,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
    {
      field: 'subject',
      headerName: 'Sujet',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'user',
      headerName: 'Utilisateur',
      width: 200,
      renderCell: ({ row }) =>
        row.user ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant='body2'>{row.user.email}</Typography>
            {(row.user.firstName || row.user.lastName) && (
              <Typography variant='caption' color='text.secondary'>
                {[row.user.firstName, row.user.lastName]
                  .filter(Boolean)
                  .join(' ')}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            —
          </Typography>
        ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          label={STATUS_LABELS[value as SupportTicketStatus]}
          size='small'
          color={STATUS_COLORS[value as SupportTicketStatus]}
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priorité',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={PRIORITY_LABELS[value as SupportTicketPriority]}
          size='small'
          color={PRIORITY_COLORS[value as SupportTicketPriority]}
          variant='outlined'
        />
      ),
    },
    {
      field: 'category',
      headerName: 'Catégorie',
      width: 130,
      renderCell: ({ value }) =>
        value ? (
          <Chip
            label={CATEGORY_LABELS[value as SupportTicketCategory]}
            size='small'
            variant='outlined'
          />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            —
          </Typography>
        ),
    },
    {
      field: 'lastReplyAt',
      headerName: 'Dernière réponse',
      width: 160,
      valueFormatter: (value: string | null) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Tooltip title='Voir le ticket'>
          <IconButton
            size='small'
            onClick={() => navigate(`/support/${row.id}`)}
            aria-label={`Voir le ticket ${row.id}`}
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
        message='Impossible de charger les tickets.'
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Support
      </Typography>

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
          placeholder='Rechercher (sujet, email, nom)…'
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
          aria-label='Rechercher des tickets'
        />

        <TextField
          size='small'
          select
          label='Statut'
          value={statusFilter}
          onChange={e => {
            setStatusFilter((e.target.value as SupportTicketStatus) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          {Object.values(SupportTicketStatus).map(s => (
            <MenuItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          select
          label='Priorité'
          value={priorityFilter}
          onChange={e => {
            setPriorityFilter((e.target.value as SupportTicketPriority) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value=''>Toutes</MenuItem>
          {Object.values(SupportTicketPriority).map(p => (
            <MenuItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          select
          label='Catégorie'
          value={categoryFilter}
          onChange={e => {
            setCategoryFilter((e.target.value as SupportTicketCategory) || '');
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value=''>Toutes</MenuItem>
          {Object.values(SupportTicketCategory).map(c => (
            <MenuItem key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </MenuItem>
          ))}
        </TextField>

        <Button
          size='small'
          startIcon={<RestartAltIcon />}
          onClick={resetFilters}
          sx={{ ml: 'auto' }}
        >
          Réinitialiser
        </Button>
      </Paper>

      <Paper sx={{ height: 'calc(100vh - 290px)', minHeight: 400 }}>
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
          onRowClick={params => navigate(`/support/${params.id}`)}
          getRowHeight={() => 56}
          sx={{ '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          aria-label='Liste des tickets de support'
        />
      </Paper>
    </Box>
  );
}
