import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@/shared/application/ThemeContext';
import { AuthProvider, useAuth } from '@/modules/auth/application/AuthContext';
import { FullPageLoader } from '@/shared/ui/NetworkStates';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import { AdminLayout } from '@/shared/ui/layout/AdminLayout';
import { LoginPage } from '@/modules/auth/ui/LoginPage';
import { MfaPage } from '@/modules/auth/ui/MfaPage';
import { DashboardPage } from '@/modules/dashboard/ui/DashboardPage';
import { UserListPage } from '@/modules/users/ui/UserListPage';
import { UserDetailPage } from '@/modules/users/ui/UserDetailPage';
import { AuditLogsPage } from '@/modules/audit/ui/AuditLogsPage';
import { TicketListPage } from '@/modules/support/ui/TicketListPage';
import { TicketDetailPage } from '@/modules/support/ui/TicketDetailPage';
import { SecurityPage } from '@/modules/security/ui/SecurityPage';
import { RbacPage } from '@/modules/rbac/ui/RbacPage';
import { AdminPermission } from '@/shared/domain/types';

function ComingSoon({ title }: { title: string }) {
  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box
        sx={{
          p: 4,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          color: 'text.secondary',
        }}
      >
        À implémenter
      </Box>
    </Box>
  );
}

function GatedPlaceholder({
  title,
  permission,
}: {
  title: string;
  permission: AdminPermission;
}) {
  return (
    <PermissionGate
      permission={permission}
      fallback={
        <ComingSoon title={`${title} — accès refusé (permission manquante)`} />
      }
    >
      <ComingSoon title={title} />
    </PermissionGate>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading, needsMfaSetup, needsMfaVerify } =
    useAuth();

  if (isLoading) return <FullPageLoader />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    );
  }

  if (needsMfaSetup || needsMfaVerify) {
    return (
      <Routes>
        <Route path='/mfa' element={<MfaPage />} />
        <Route path='*' element={<Navigate to='/mfa' replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/users' element={<UserListPage />} />
        <Route path='/users/:id' element={<UserDetailPage />} />
        <Route
          path='/security'
          element={
            <PermissionGate
              permission={AdminPermission.SECURITY_READ}
              fallback={
                <ComingSoon title='Sécurité — accès refusé (permission manquante)' />
              }
            >
              <SecurityPage />
            </PermissionGate>
          }
        />
        <Route
          path='/rbac'
          element={
            <PermissionGate
              permission={AdminPermission.RBAC_READ}
              fallback={
                <ComingSoon title='RBAC — accès refusé (permission manquante)' />
              }
            >
              <RbacPage />
            </PermissionGate>
          }
        />
        <Route path='/support' element={<TicketListPage />} />
        <Route path='/support/:id' element={<TicketDetailPage />} />
        <Route
          path='/subscriptions'
          element={
            <GatedPlaceholder
              title='Abonnements'
              permission={AdminPermission.SUBSCRIPTIONS_READ}
            />
          }
        />
        <Route
          path='/cloud'
          element={
            <GatedPlaceholder
              title='Cloud'
              permission={AdminPermission.CLOUD_READ}
            />
          }
        />
        <Route
          path='/rgpd'
          element={
            <GatedPlaceholder
              title='RGPD'
              permission={AdminPermission.RGPD_EXPORT}
            />
          }
        />
        <Route path='/audit' element={<AuditLogsPage />} />
      </Route>
      <Route path='/login' element={<Navigate to='/dashboard' replace />} />
      <Route path='*' element={<Navigate to='/dashboard' replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster
              position='bottom-right'
              toastOptions={{
                style: { borderRadius: 10, fontSize: 14 },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
