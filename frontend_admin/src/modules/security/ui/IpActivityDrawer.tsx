import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import { useIpActivity } from '@/modules/security/application/useBlockedIps';
import {
  InlineLoader,
  ErrorState,
  EmptyState,
} from '@/shared/ui/NetworkStates';
import { Severity, type SecurityLog } from '@/shared/domain/types';

const SEVERITY_COLORS: Record<Severity, 'info' | 'warning' | 'error'> = {
  [Severity.INFO]: 'info',
  [Severity.WARNING]: 'warning',
  [Severity.CRITICAL]: 'error',
};

interface Props {
  ip: string | null;
  open: boolean;
  onClose: () => void;
}

function LogRow({ log }: { log: SecurityLog }) {
  return (
    <Box
      sx={{
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Chip
          label={log.severity}
          size='small'
          color={SEVERITY_COLORS[log.severity] ?? 'default'}
        />
        <Chip
          label={log.eventType}
          size='small'
          variant='outlined'
          sx={{ fontFamily: 'monospace', fontSize: 11 }}
        />
        {log.isSuspicious && (
          <Chip
            label='Suspect'
            size='small'
            color='warning'
            variant='outlined'
          />
        )}
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ ml: 'auto' }}
        >
          {new Date(log.createdAt).toLocaleString('fr-FR')}
        </Typography>
      </Box>
      {log.userEmail && (
        <Typography variant='caption' color='text.secondary'>
          Utilisateur : {log.userEmail}
        </Typography>
      )}
    </Box>
  );
}

export function IpActivityDrawer({ ip, open, onClose }: Props) {
  const { data, isLoading, isError, refetch } = useIpActivity(open ? ip : null);

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant='h6'>Activité de l&apos;IP</Typography>
          {ip && (
            <Typography
              variant='caption'
              fontFamily='monospace'
              color='text.secondary'
            >
              {ip}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label='Fermer'>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, overflowY: 'auto' }}>
        {isLoading && <InlineLoader />}
        {isError && (
          <ErrorState
            message="Impossible de charger l'activité de cette IP."
            onRetry={refetch}
          />
        )}
        {data && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                Statut :
              </Typography>
              <Chip
                label={data.isBlocked ? 'Bloquée' : 'Non bloquée'}
                size='small'
                color={data.isBlocked ? 'error' : 'success'}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              20 derniers événements
            </Typography>

            {data.recentLogs.length === 0 ? (
              <EmptyState message='Aucun événement enregistré pour cette IP.' />
            ) : (
              data.recentLogs.map(log => <LogRow key={log.id} log={log} />)
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
}
