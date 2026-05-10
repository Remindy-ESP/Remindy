import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { Topbar } from './Topbar';
import { Breadcrumbs } from './Breadcrumbs';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar onMenuToggle={() => setMobileOpen(true)} />
        <Box sx={{ px: { xs: 2, md: 3 }, py: 2, flexGrow: 1 }}>
          <Breadcrumbs pathname={location.pathname} />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
