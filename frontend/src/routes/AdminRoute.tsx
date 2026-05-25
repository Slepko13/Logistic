import { UserRole } from '@/constants/userRole';
import RoleRoute from './RoleRoute';

export default function AdminRoute() {
  return <RoleRoute allowedRoles={[UserRole.ADMIN]} />;
}
