import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/modules/audit/application/useAuditLogs';
import { InlineLoader, ErrorState } from '@/shared/ui/NetworkStates';
import { Severity } from '@/shared/domain/types';

const SEVERITY_COLORS: Record<Severity, 'info' | 'warning' | 'error'> = {
  [Severity.INFO]: 'info',
  [Severity.WARNING]: 'warning',
  [Severity.CRITICAL]: 'error',
};

interface Props {
  logId: string | null;
  open: boolean;
  onClose: () => void;
}

function JsonBlock({ value }: { value: Record<string, unknown> | null }) {
  const formatted = value ? JSON.stringify(value, null, 2) : null;

  const handleCopy = async () => {
    if (!formatted) return;
    await navigator.clipboard.writeText(formatted);
    toast.success('Copié dans le presse-papier');
  };

  if (!formatted) {
    return (
      <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
        Aucune donnée
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title='Copier'>
        <IconButton
          size='small'
          onClick={handleCopy}
          sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
          aria-label='Copier le JSON'
        >
          <ContentCopyIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Box
        component='pre'
        sx={{
          m: 0,
          p: 2,
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          fontSize: 13,
          fontFamily: 'monospace',
          overflow: 'auto',
          maxHeight: 360,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {formatted}
      </Box>
    </Box>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ width: 140, flexShrink: 0, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function AuditLogDetailDrawer({ logId, open, onClose }: Props) {
  const [tab, setTab] = useState<'before' | 'after'>('before');
  const {
    data: log,
    isLoading,
    isError,
    refetch,
  } = useAuditLog(open ? logId : null);

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}
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
        <Typography variant='h6'>Détails de l&apos;événement</Typography>
        <IconButton onClick={onClose} aria-label='Fermer'>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, overflowY: 'auto' }}>
        {isLoading && <InlineLoader />}
        {isError && (
          <ErrorState
            message='Impossible de charger ce log.'
            onRetry={refetch}
          />
        )}
        {log && (
          <>
            <MetaRow label='ID'>
              <Typography
                variant='body2'
                fontFamily='monospace'
                sx={{ wordBreak: 'break-all' }}
              >
                {log.id}
              </Typography>
            </MetaRow>
            <MetaRow label='Date'>
              <Typography variant='body2'>
                {new Date(log.createdAt).toLocaleString('fr-FR')}
              </Typography>
            </MetaRow>
            <MetaRow label='Action'>
              <Chip label={log.action} size='small' variant='outlined' />
            </MetaRow>
            <MetaRow label='Sévérité'>
              <Chip
                label={log.severity}
                size='small'
                color={SEVERITY_COLORS[log.severity]}
              />
            </MetaRow>
            <MetaRow label='Succès'>
              <Typography variant='body2'>
                {log.success ? '✅ Oui' : '❌ Non'}
              </Typography>
            </MetaRow>
            <MetaRow label='Ressource'>
              <Typography variant='body2'>{log.resourceType}</Typography>
            </MetaRow>
            <MetaRow label='ID ressource'>
              <Typography
                variant='body2'
                fontFamily='monospace'
                sx={{ wordBreak: 'break-all' }}
              >
                {log.resourceId ?? '—'}
              </Typography>
            </MetaRow>
            <MetaRow label='Utilisateur'>
              <Typography
                variant='body2'
                fontFamily='monospace'
                sx={{ wordBreak: 'break-all' }}
              >
                {log.actorUserId ?? 'Système'}
              </Typography>
            </MetaRow>
            <MetaRow label='IP'>
              <Typography variant='body2'>{log.ipAddress ?? '—'}</Typography>
            </MetaRow>
            <MetaRow label='User-Agent'>
              <Typography variant='caption' sx={{ wordBreak: 'break-all' }}>
                {log.userAgent ?? '—'}
              </Typography>
            </MetaRow>
            {log.errorMessage && (
              <MetaRow label='Erreur'>
                <Typography variant='body2' color='error'>
                  {log.errorMessage}
                </Typography>
              </MetaRow>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Payload
            </Typography>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 1 }}
              aria-label='Avant / Après'
            >
              <Tab value='before' label='Avant' />
              <Tab value='after' label='Après' />
            </Tabs>

            <JsonBlock value={tab === 'before' ? log.before : log.after} />
          </>
        )}
      </Box>
    </Drawer>
  );
}
