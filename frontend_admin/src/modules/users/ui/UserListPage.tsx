import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { useAdminUsers } from '@/modules/users/application/useAdminUsers';
import { ErrorState } from '@/shared/ui/NetworkStates';
import type { AdminUser, UserListQuery } from '@/shared/domain/types';
import type { Role, UserStatus } from '@/shared/domain/types';

const STATUS_COLORS: Record<
  string,
  'success' | 'error' | 'warning' | 'default'
> = {
  active: 'success',
  verified: 'success',
  banned: 'error',
  inactive: 'warning',
};

const ROLE_LABELS: Record<string, string> = {
  user_freemium: 'Freemium',
  user_premium: 'Premium',
  user_admin: 'Admin',
  super_admin: 'Super Admin',
};

export function UserListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UserListQuery>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortDir: 'DESC',
  });
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useAdminUsers({
    ...filters,
    q: search || undefined,
  });

  const handlePagination = useCallback((model: GridPaginationModel) => {
    setFilters(f => ({
      ...f,
      page: model.page + 1,
      limit: model.pageSize,
    }));
  }, []);

  const columns: GridColDef<AdminUser>[] = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) =>
        [row.firstName, row.lastName].filter(Boolean).join(' ') || '—',
    },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          label={ROLE_LABELS[value] || value}
          size='small'
          variant='outlined'
          color={value === 'super_admin' ? 'secondary' : 'default'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size='small'
          color={STATUS_COLORS[value] || 'default'}
        />
      ),
    },
    {
      field: 'emailVerified',
      headerName: 'Email vérifié',
      width: 120,
      type: 'boolean',
    },
    {
      field: 'mfaEnabled',
      headerName: 'MFA',
      width: 80,
      type: 'boolean',
    },
    {
      field: 'createdAt',
      headerName: 'Créé le',
      width: 130,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleDateString('fr-FR') : '—',
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
            onClick={() => navigate(`/users/${row.id}`)}
            aria-label={`Voir ${row.email}`}
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
        message='Impossible de charger les utilisateurs.'
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Utilisateurs
      </Typography>

      {/* Filters bar */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size='small'
          placeholder='Rechercher (nom, email)…'
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
          aria-label='Rechercher un utilisateur'
        />

        <TextField
          size='small'
          select
          label='Rôle'
          value={filters.role || ''}
          onChange={e =>
            setFilters(f => ({
              ...f,
              role: (e.target.value as Role) || undefined,
              page: 1,
            }))
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <MenuItem key={k} value={k}>
              {v}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          select
          label='Statut'
          value={filters.status || ''}
          onChange={e =>
            setFilters(f => ({
              ...f,
              status: (e.target.value as UserStatus) || undefined,
              page: 1,
            }))
          }
          sx={{ minWidth: 130 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          <MenuItem value='active'>Active</MenuItem>
          <MenuItem value='verified'>Verified</MenuItem>
          <MenuItem value='banned'>Banned</MenuItem>
          <MenuItem value='inactive'>Inactive</MenuItem>
        </TextField>
      </Paper>

      {/* Data grid */}
      <Paper sx={{ height: 'calc(100vh - 290px)', minHeight: 400 }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          rowCount={data?.total ?? 0}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationMode='server'
          paginationModel={{
            page: (filters.page ?? 1) - 1,
            pageSize: filters.limit ?? 25,
          }}
          onPaginationModelChange={handlePagination}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
          }}
          onRowClick={params => navigate(`/users/${params.id}`)}
          aria-label='Liste des utilisateurs'
        />
      </Paper>
    </Box>
  );
}
