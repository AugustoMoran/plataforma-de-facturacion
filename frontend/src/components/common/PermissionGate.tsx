import { useAppSelector } from '../../store/hooks';
import { selectHasPermission } from '../../features/auth/permissionsSlice';
import { selectUserRole } from '../../features/auth/authSlice';

interface PermissionGateProps {
  permission?: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, role, fallback = null, children }: PermissionGateProps) {
  const hasPermission = useAppSelector(permission ? selectHasPermission(permission) : () => true);
  const userRole = useAppSelector(selectUserRole);

  const roleMatch = role ? userRole === role : true;
  const permMatch = permission ? hasPermission : true;

  if (!permMatch || !roleMatch) return <>{fallback}</>;
  return <>{children}</>;
}
