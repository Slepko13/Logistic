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

// Компонент, який показується, якщо весь додаток "впав" через критичну помилку
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-red-50 text-center p-4">
      <h2 className="mb-4 text-3xl font-bold text-red-600">Ой! Щось пішло не так 🤕</h2>
      <p className="mb-4 text-gray-700">Ми вже знаємо про цю проблему і працюємо над нею.</p>
      <pre className="mb-8 p-4 bg-white rounded shadow text-left text-sm text-red-800 max-w-2xl overflow-auto">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition"
      >
        Перезавантажити сторінку
      </button>
    </div>
  );
}

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
