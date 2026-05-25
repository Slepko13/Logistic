import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/common/PageLoader';

export default function ProtectedRoute() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
