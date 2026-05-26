import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type {
  GridColDef,
  GridPaginationModel,
  GridRowParams,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { ErrorState } from '@/shared/ui/NetworkStates';

export interface DataTablePagination {
  page: number;
  limit: number;
}

interface DataTablePageProps<T extends GridValidRowModel> {
  title: string;
  filters?: ReactNode;
  columns: GridColDef<T>[];
  rows: T[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  pagination: DataTablePagination;
  onPaginationChange: (next: DataTablePagination) => void;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string | number;
  ariaLabel?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function DataTablePage<T extends GridValidRowModel>({
  title,
  filters,
  columns,
  rows,
  total,
  isLoading,
  isError,
  errorMessage = 'Impossible de charger les données.',
  onRetry,
  pagination,
  onPaginationChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onRowClick,
  getRowId,
  ariaLabel,
}: DataTablePageProps<T>) {
  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  const handlePagination = (model: GridPaginationModel) => {
    onPaginationChange({
      page: model.page + 1,
      limit: model.pageSize,
    });
  };

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        {title}
      </Typography>

      {filters && (
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
          {filters}
        </Paper>
      )}

      <Paper sx={{ height: 'calc(100vh - 290px)', minHeight: 400 }}>
        <DataGrid<T>
          rows={rows}
          columns={columns}
          rowCount={total}
          loading={isLoading}
          pageSizeOptions={pageSizeOptions}
          paginationMode='server'
          paginationModel={{
            page: pagination.page - 1,
            pageSize: pagination.limit,
          }}
          onPaginationModelChange={handlePagination}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          getRowId={getRowId}
          onRowClick={
            onRowClick
              ? (params: GridRowParams<T>) => onRowClick(params.row)
              : undefined
          }
          sx={
            onRowClick
              ? { '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }
              : undefined
          }
          aria-label={ariaLabel ?? title}
        />
      </Paper>
    </Box>
  );
}
