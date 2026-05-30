import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectIsLoading } from '../features/auth/authSlice';
import { usePermission } from '../hooks/usePermission';
import { Spinner } from '../components/common/Spinner';

interface ProtectedRouteProps {
  requiredPermission?: string;
  redirectTo?: string;
}

export function ProtectedRoute({ requiredPermission, redirectTo = '/login' }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const location = useLocation();
  const hasPermission = usePermission(requiredPermission ?? '');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
