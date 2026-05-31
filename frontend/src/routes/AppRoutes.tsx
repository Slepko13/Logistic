import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/common/PageLoader';
import AdminRoute from './AdminRoute';
import GuestRoute from './GuestRoute';
import ProtectedRoute from './ProtectedRoute';
import ErrorFallback from './ErrorFallback';
import BootstrapGate from './BootstrapGate';

// Lazy-loaded сторінки (будуть завантажуватись лише тоді, коли користувач на них переходить)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminVehiclesPage = lazy(() => import('@/pages/admin/AdminVehiclesPage'));
const AdminCitiesPage = lazy(() => import('@/pages/admin/AdminCitiesPage'));
const AdminTripsPage = lazy(() => import('@/pages/admin/AdminTripsPage'));
const AdminTripHistoryPage = lazy(() => import('@/pages/admin/AdminTripHistoryPage'));
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage'));

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
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="trips/:id" element={<TripDetailPage />} />
                  <Route path="admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<AdminTripsPage />} />
                      <Route path="history" element={<AdminTripHistoryPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="vehicles" element={<AdminVehiclesPage />} />
                      <Route path="cities" element={<AdminCitiesPage />} />
                    </Route>
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
