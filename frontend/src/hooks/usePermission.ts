import { useAppSelector } from '../store/hooks';
import { selectUserPermissions } from '../features/auth/authSlice';

export function usePermission(permission: string): boolean {
  const permissions = useAppSelector(selectUserPermissions);
  return permissions[permission] === true;
}

export function usePermissions(permissions: string[]): Record<string, boolean> {
  const userPermissions = useAppSelector(selectUserPermissions);
  return permissions.reduce(
    (acc, permission) => ({
      ...acc,
      [permission]: userPermissions[permission] === true,
    }),
    {},
  );
}

export function useIsAdmin(): boolean {
  const user = useAppSelector((state) => state.auth.user);
  return user?.role === 'admin';
}
