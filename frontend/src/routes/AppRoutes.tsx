import { useEffect, ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/common/PageLoader';
import AdminRoute from './AdminRoute';
import GuestRoute from './GuestRoute';
import ProtectedRoute from './ProtectedRoute';

// Lazy-loaded сторінки (будуть завантажуватись лише тоді, коли користувач на них переходить)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage'));

import { FallbackProps } from 'react-error-boundary';

// Компонент, який показується, якщо весь додаток "впав" через критичну помилку
function ErrorFallback({ error }: FallbackProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
      <h2 className="mb-4 text-3xl font-bold text-destructive">Ой! Щось пішло не так 🤕</h2>
      <p className="mb-4 text-muted-foreground">
        Ми вже знаємо про цю проблему і працюємо над нею.
      </p>
      <pre className="mb-8 p-4 bg-card border border-border rounded shadow text-left text-sm text-destructive max-w-2xl overflow-auto">
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Перезавантажити сторінку
      </button>
    </div>
  );
}

function BootstrapGate({ children }: { children: ReactNode }) {
  const { bootstrap, bootstrapping } = useAuth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (bootstrapping) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <BrowserRouter>
        <BootstrapGate>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="trips/:id" element={<TripDetailPage />} />
                  <Route element={<AdminRoute />}>
                    <Route path="admin/users" element={<AdminUsersPage />} />
                  </Route>
                </Route>
              </Route>

              {/* 404 Сторінка */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BootstrapGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
