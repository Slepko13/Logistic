import { useEffect, ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/common/PageLoader';
import DashboardPage from '@/pages/DashboardPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AdminRoute from './AdminRoute';
import GuestRoute from './GuestRoute';
import ProtectedRoute from './ProtectedRoute';

function BootstrapGate({ children }: { children: ReactNode }) {
  const { bootstrap, bootstrapping } = useAuth();

  useEffect(() => {
    const controller = new AbortController();
    bootstrap({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [bootstrap]);

  if (bootstrapping) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <BootstrapGate>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route element={<AdminRoute />}>
                <Route path="admin/users" element={<AdminUsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BootstrapGate>
    </BrowserRouter>
  );
}
