import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useBlockedIps } from '@/modules/security/application/useBlockedIps';
import { useSecurityActions } from '@/modules/security/application/useSecurityActions';
import {
  ErrorState,
  InlineLoader,
  EmptyState,
} from '@/shared/ui/NetworkStates';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { AdminPermission, type BlockedIp } from '@/shared/domain/types';
import { BlockIpDialog } from './BlockIpDialog';
import { IpActivityDrawer } from './IpActivityDrawer';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR');
}

function isExpired(ip: BlockedIp, now: Date): boolean {
  if (!ip.isActive) return true;
  if (!ip.blockedUntil) return false;
  return new Date(ip.blockedUntil) <= now;
}

export function BlockedIpsTab() {
  const [includeExpired, setIncludeExpired] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useBlockedIps(includeExpired);
  const { unblockIp } = useSecurityActions();
  const now = new Date();

  const handleUnblock = (ip: BlockedIp) => {
    if (
      !window.confirm(
        `Débloquer l'IP ${ip.ipAddress} ? Cette action est tracée.`
      )
    ) {
      return;
    }
    unblockIp.mutate(ip.id);
  };

  if (isError) {
    return (
      <ErrorState
        message='Impossible de charger les IPs bloquées.'
        onRetry={refetch}
      />
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={includeExpired}
              onChange={e => setIncludeExpired(e.target.checked)}
            />
          }
          label='Inclure les blocages expirés'
        />

        <PermissionGate permission={AdminPermission.SECURITY_WRITE}>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ ml: 'auto' }}
          >
            Bloquer une IP
          </Button>
        </PermissionGate>
      </Box>

      <Paper>
        {isLoading ? (
          <InlineLoader />
        ) : !data || data.length === 0 ? (
          <EmptyState
            message={
              includeExpired
                ? 'Aucune IP bloquée enregistrée.'
                : 'Aucune IP actuellement bloquée.'
            }
          />
        ) : (
          <TableContainer>
            <Table size='small' aria-label='Liste des IPs bloquées'>
              <TableHead>
                <TableRow>
                  <TableCell>IP</TableCell>
                  <TableCell>Raison</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Bloquée par</TableCell>
                  <TableCell>Créée le</TableCell>
                  <TableCell>Expire le</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(ip => {
                  const expired = isExpired(ip, now);
                  return (
                    <TableRow
                      key={ip.id}
                      hover
                      onClick={() => setSelectedIp(ip.ipAddress)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography
                          variant='body2'
                          fontFamily='monospace'
                          sx={{ fontSize: 12 }}
                        >
                          {ip.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ip.reason}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {ip.notes ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='caption'
                          fontFamily='monospace'
                          sx={{ fontSize: 11 }}
                        >
                          {ip.blockedBy
                            ? `${ip.blockedBy.substring(0, 8)}…`
                            : 'Système'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption'>
                          {formatDate(ip.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption'>
                          {ip.blockedUntil
                            ? formatDate(ip.blockedUntil)
                            : 'Permanent'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expired ? 'Expirée' : 'Active'}
                          size='small'
                          color={expired ? 'default' : 'error'}
                        />
                      </TableCell>
                      <TableCell
                        align='right'
                        onClick={e => e.stopPropagation()}
                      >
                        <PermissionGate
                          permission={AdminPermission.SECURITY_WRITE}
                        >
                          <Tooltip title='Débloquer'>
                            <span>
                              <IconButton
                                size='small'
                                disabled={expired || unblockIp.isPending}
                                onClick={() => handleUnblock(ip)}
                                aria-label={`Débloquer ${ip.ipAddress}`}
                              >
                                <LockOpenIcon fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </PermissionGate>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <BlockIpDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <IpActivityDrawer
        ip={selectedIp}
        open={!!selectedIp}
        onClose={() => setSelectedIp(null)}
      />
    </Box>
  );
}
