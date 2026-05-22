import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/shared/application/ThemeContext';
import { AuthProvider, useAuth } from '@/modules/auth/application/AuthContext';
import { FullPageLoader } from '@/shared/ui/NetworkStates';
import { AdminLayout } from '@/shared/ui/layout/AdminLayout';
import { LoginPage } from '@/modules/auth/ui/LoginPage';
import { MfaPage } from '@/modules/auth/ui/MfaPage';
import { DashboardPage } from '@/modules/dashboard/ui/DashboardPage';
import { UserListPage } from '@/modules/users/ui/UserListPage';
import { UserDetailPage } from '@/modules/users/ui/UserDetailPage';
import { AuditLogsPage } from '@/modules/audit/ui/AuditLogsPage';

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
