import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/common/PageLoader';
import { UserRoleType } from '@/constants/userRole';

interface RoleRouteProps {
  allowedRoles: UserRoleType[];
  redirectTo?: string;
}

export default function RoleRoute({ allowedRoles, redirectTo = '/' }: RoleRouteProps) {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <PageLoader />;
  }

  if (!user || !allowedRoles.includes(user.role as UserRoleType)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
