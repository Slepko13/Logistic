import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/common/PageLoader';

export default function GuestRoute() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
