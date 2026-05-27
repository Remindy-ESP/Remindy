import { useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import {
  AdminPermission,
  type Subscription,
  type SubscriptionPlan,
} from '@/shared/domain/types';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { SubscriptionFrequencyBadge } from './SubscriptionFrequencyBadge';
import { EditSharedSubscriptionDialog } from './EditSharedSubscriptionDialog';

const DRAWER_WIDTH = 440;

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

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        py: 1.2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ width: 140, flexShrink: 0, fontWeight: 600, alignSelf: 'center' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{value}</Box>
    </Box>
  );
}

interface Props {
  subscription: Subscription | null;
  onClose: () => void;
}

export function SubscriptionDetailDrawer({ subscription, onClose }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Drawer
        anchor='right'
        open={!!subscription}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: DRAWER_WIDTH } } }}
      >
        {subscription && (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant='h6' fontWeight={700}>
                {subscription.name}
              </Typography>
              <IconButton onClick={onClose} aria-label='Fermer'>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <SubscriptionStatusBadge status={subscription.status} />
              <SubscriptionFrequencyBadge
                frequency={subscription.frequency as SubscriptionPlan}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Field
              label='ID'
              value={
                <Typography variant='body2' fontFamily='monospace'>
                  {subscription.id}
                </Typography>
              }
            />
            <Field
              label='Utilisateur'
              value={
                <Link
                  component={RouterLink}
                  to={`/users/${subscription.userId}`}
                  variant='body2'
                >
                  {subscription.userId}
                </Link>
              }
            />
            <Field
              label='Montant'
              value={formatMoney(
                Number(subscription.amount),
                subscription.currency
              )}
            />
            <Field label='Devise' value={subscription.currency} />
            <Field label='Début' value={formatDate(subscription.startDate)} />
            <Field label='Fin' value={formatDate(subscription.endDate)} />
            <Field
              label='Prochaine échéance'
              value={formatDate(subscription.nextDueDate)}
            />
            {subscription.trialStartDate && (
              <Field
                label='Essai début'
                value={formatDate(subscription.trialStartDate)}
              />
            )}
            {subscription.trialEndDate && (
              <Field
                label='Essai fin'
                value={formatDate(subscription.trialEndDate)}
              />
            )}
            {subscription.color && (
              <Field
                label='Couleur'
                value={
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: subscription.color,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Typography variant='body2' fontFamily='monospace'>
                      {subscription.color}
                    </Typography>
                  </Box>
                }
              />
            )}
            {subscription.notes && (
              <Field
                label='Notes'
                value={
                  <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                    {subscription.notes}
                  </Typography>
                }
              />
            )}
            <Field label='Créé le' value={formatDate(subscription.createdAt)} />
            <Field
              label='Modifié le'
              value={formatDate(subscription.updatedAt)}
            />

            <PermissionGate permission={AdminPermission.CLOUD_WRITE}>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant='contained'
                  startIcon={<EditIcon />}
                  onClick={() => setEditOpen(true)}
                  fullWidth
                >
                  Éditer
                </Button>
              </Box>
            </PermissionGate>
          </Box>
        )}
      </Drawer>

      {subscription && (
        <EditSharedSubscriptionDialog
          subscription={subscription}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
