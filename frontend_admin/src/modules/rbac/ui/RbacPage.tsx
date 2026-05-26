import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useRoles } from '@/modules/rbac/application/useRoles';
import { ErrorState, InlineLoader } from '@/shared/ui/NetworkStates';
import { RoleList } from './RoleList';

export function RbacPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedKey = searchParams.get('role');
  const { data: roles, isLoading, isError, refetch } = useRoles();

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('role', key);
    setSearchParams(params, { replace: true });
  };

  if (isError) {
    return (
      <ErrorState
        message='Impossible de charger les rôles.'
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        RBAC
      </Typography>

      <Grid container spacing={3} sx={{ minHeight: 'calc(100vh - 220px)' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          {isLoading || !roles ? (
            <Paper sx={{ height: '100%' }}>
              <InlineLoader />
            </Paper>
          ) : (
            <RoleList
              roles={roles}
              selectedKey={selectedKey}
              onSelect={handleSelect}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              height: '100%',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant='body2'>
              {selectedKey
                ? 'Panneau de permissions — à implémenter'
                : 'Sélectionnez un rôle dans la liste pour voir ses permissions.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
