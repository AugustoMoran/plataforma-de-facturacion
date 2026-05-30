import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Building2,
  Users,
  Shield,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { clearCredentials } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../api/authApi';
import { PermissionGate } from '../common/PermissionGate';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Productos', icon: Package, permission: 'viewProducts' },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart, permission: 'viewSales' },
  { path: '/stock', label: 'Stock', icon: Warehouse, permission: 'viewStock' },
  { path: '/branches', label: 'Sucursales', icon: Building2, permission: 'viewBranches' },
  { path: '/users', label: 'Usuarios', icon: Users, permission: 'viewUsers' },
  { path: '/roles', label: 'Roles', icon: Shield, permission: 'manageRoles' },
  { path: '/reports', label: 'Reportes', icon: BarChart3, permission: 'viewReports' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      dispatch(clearCredentials());
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <span className="text-lg font-bold text-primary truncate">
            Facturación Pro
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          const linkContent = (
            <Link
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (item.permission) {
            return (
              <PermissionGate key={item.path} permission={item.permission}>
                {linkContent}
              </PermissionGate>
            );
          }

          return <div key={item.path}>{linkContent}</div>;
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
          )}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
