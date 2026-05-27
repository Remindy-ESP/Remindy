import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CloudIcon from '@mui/icons-material/Cloud';
import GavelIcon from '@mui/icons-material/Gavel';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { useDashboard } from '@/modules/dashboard/application/useDashboard';
import { AdminPermission } from '@/shared/domain/types';

export const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  permission?: AdminPermission;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    permission: AdminPermission.DASHBOARD_READ,
  },
  {
    label: 'Utilisateurs',
    path: '/users',
    icon: <PeopleIcon />,
    permission: AdminPermission.USERS_READ,
  },
  {
    label: 'Sécurité',
    path: '/security',
    icon: <SecurityIcon />,
    permission: AdminPermission.SECURITY_READ,
  },
  {
    label: 'RBAC',
    path: '/rbac',
    icon: <VpnKeyIcon />,
    permission: AdminPermission.RBAC_READ,
  },
  {
    label: 'Support',
    path: '/support',
    icon: <SupportAgentIcon />,
    permission: AdminPermission.SUPPORT_READ,
  },
  {
    label: 'Abonnements',
    path: '/subscriptions',
    icon: <SubscriptionsIcon />,
    permission: AdminPermission.SUBSCRIPTIONS_READ,
  },
  {
    label: 'Cloud',
    path: '/cloud',
    icon: <CloudIcon />,
    permission: AdminPermission.CLOUD_READ,
  },
  {
    label: 'RGPD',
    path: '/rgpd',
    icon: <GavelIcon />,
    permission: AdminPermission.RGPD_EXPORT,
  },
  {
    label: 'Audit',
    path: '/audit',
    icon: <ReceiptLongIcon />,
    permission: AdminPermission.AUDIT_READ,
  },
];

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canSeeDashboard = hasPermission(AdminPermission.DASHBOARD_READ);
  const canSeeSupport = hasPermission(AdminPermission.SUPPORT_READ);
  const { data: dashboard } = useDashboard(
    {},
    { enabled: canSeeDashboard && canSeeSupport }
  );
  const openTicketsCount = dashboard?.support.open ?? 0;

  const filteredItems = NAV_ITEMS.filter(
    item => !item.permission || hasPermission(item.permission)
  );

  const renderIcon = (item: NavItem) => {
    if (item.path === '/support' && openTicketsCount > 0) {
      return (
        <Badge
          badgeContent={openTicketsCount}
          color='error'
          max={99}
          overlap='circular'
        >
          {item.icon}
        </Badge>
      );
    }
    return item.icon;
  };

  const drawer = (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      role='navigation'
      aria-label='Menu principal'
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          R
        </Box>
        <Box>
          <Typography variant='subtitle1' fontWeight={700}>
            Remindy
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Administration
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1, py: 1, px: 1 }}>
        {filteredItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              aria-current={active ? 'page' : undefined}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: '#fff' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {renderIcon(item)}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component='nav'
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile */}
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>
      {/* Desktop */}
      <Drawer
        variant='permanent'
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}
