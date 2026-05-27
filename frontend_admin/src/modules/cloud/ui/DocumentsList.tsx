import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { useAdminDocuments } from '@/modules/cloud/application/useAdminDocuments';
import { ErrorState } from '@/shared/ui/NetworkStates';
import { OcrStatusBadge, OCR_STATUS_LABELS } from './OcrStatusBadge';
import {
  OcrStatus,
  type AdminDocument,
  type AdminDocumentQuery,
} from '@/shared/domain/types';

function formatBytes(bytes: number) {
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

function MimeIcon({ mime }: { mime: string }) {
  if (mime?.startsWith('image/'))
    return <ImageIcon fontSize='small' color='action' />;
  if (mime === 'application/pdf')
    return <PictureAsPdfIcon fontSize='small' color='error' />;
  if (mime?.startsWith('text/') || mime?.includes('document'))
    return <DescriptionIcon fontSize='small' color='primary' />;
  return <InsertDriveFileIcon fontSize='small' color='action' />;
}

interface Props {
  ocrStatusFilter: OcrStatus | '';
  onOcrStatusFilterChange: (status: OcrStatus | '') => void;
  onRowClick: (doc: AdminDocument) => void;
}

export function DocumentsList({
  ocrStatusFilter,
  onOcrStatusFilterChange,
  onRowClick,
}: Props) {
  const [filters, setFilters] = useState<AdminDocumentQuery>({
    page: 1,
    limit: 25,
    sortBy: 'uploadedAt',
    sortDir: 'DESC',
  });
  const [filename, setFilename] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [uploadedFrom, setUploadedFrom] = useState('');
  const [uploadedTo, setUploadedTo] = useState('');

  useEffect(() => {
    setFilters(f => ({ ...f, page: 1 }));
  }, [ocrStatusFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useAdminDocuments({
    ...filters,
    ocrStatus: ocrStatusFilter || undefined,
    filename: filename || undefined,
    mimeType: mimeType || undefined,
    uploadedFrom: uploadedFrom || undefined,
    uploadedTo: uploadedTo || undefined,
  });

  const resetFilters = () => {
    setFilename('');
    setMimeType('');
    setUploadedFrom('');
    setUploadedTo('');
    onOcrStatusFilterChange('');
    setFilters(f => ({ ...f, page: 1 }));
  };

  const handlePagination = useCallback((model: GridPaginationModel) => {
    setFilters(f => ({ ...f, page: model.page + 1, limit: model.pageSize }));
  }, []);

  const columns: GridColDef<AdminDocument>[] = [
    {
      field: 'filename',
      headerName: 'Nom',
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MimeIcon mime={row.mimeType} />
          <Typography variant='body2' noWrap>
            {row.filename}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'mimeType',
      headerName: 'Type',
      width: 160,
      renderCell: ({ value }) => (
        <Typography variant='caption' fontFamily='monospace'>
          {value as string}
        </Typography>
      ),
    },
    {
      field: 'fileSize',
      headerName: 'Taille',
      width: 100,
      renderCell: ({ value }) => formatBytes(Number(value)),
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
      field: 'ocrStatus',
      headerName: 'OCR',
      width: 130,
      renderCell: ({ value }) => <OcrStatusBadge status={value as OcrStatus} />,
    },
    {
      field: 'uploadedAt',
      headerName: 'Uploadé le',
      width: 160,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString('fr-FR') : '—',
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message='Impossible de charger les documents.'
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
          placeholder='Rechercher par nom de fichier…'
          value={filename}
          onChange={e => {
            setFilename(e.target.value);
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
          aria-label='Rechercher des documents'
        />

        <TextField
          size='small'
          select
          label='Statut OCR'
          value={ocrStatusFilter}
          onChange={e =>
            onOcrStatusFilterChange((e.target.value as OcrStatus) || '')
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value=''>Tous</MenuItem>
          {Object.values(OcrStatus).map(s => (
            <MenuItem key={s} value={s}>
              {OCR_STATUS_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          label='Type MIME'
          placeholder='application/pdf'
          value={mimeType}
          onChange={e => {
            setMimeType(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 180 }}
        />

        <TextField
          size='small'
          type='date'
          label='Du'
          value={uploadedFrom}
          onChange={e => {
            setUploadedFrom(e.target.value);
            setFilters(f => ({ ...f, page: 1 }));
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <TextField
          size='small'
          type='date'
          label='Au'
          value={uploadedTo}
          onChange={e => {
            setUploadedTo(e.target.value);
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
          onRowClick={params => onRowClick(params.row as AdminDocument)}
          sx={{ '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          aria-label='Liste des documents'
        />
      </Paper>
    </Box>
  );
}
