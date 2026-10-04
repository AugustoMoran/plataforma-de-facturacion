import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { isCustomerRole, isStaffRole } from './RouteGuards';

const navItemClass = (active: boolean) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
    active ? 'text-white' : 'text-blue-200/75'
  }`;

export const StoreMobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const isCustomer = user && isCustomerRole(user.roles);
  const isStaff = user && isStaffRole(user.roles);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/account') return location.pathname === '/account';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-blue-200/20 bg-blue-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación de tienda"
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        <Link to="/" className={navItemClass(isActive('/'))} aria-label="Inicio">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </Link>

        <Link to="/products" className={navItemClass(isActive('/products'))} aria-label="Productos">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Tienda
        </Link>

        {isCustomer ? (
          <>
            <Link to="/account/orders" className={navItemClass(isActive('/account/orders'))} aria-label="Mis pedidos">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Pedidos
            </Link>
            <Link to="/account" className={navItemClass(isActive('/account'))} aria-label="Mi cuenta">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Cuenta
            </Link>
          </>
        ) : isStaff ? (
          <Link to="/dashboard" className={navItemClass(location.pathname.startsWith('/dashboard'))} aria-label="Panel">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Panel
          </Link>
        ) : (
          <>
            <Link to="/login" className={navItemClass(isActive('/login'))} aria-label="Ingresar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Ingresar
            </Link>
            <Link to="/register" className={navItemClass(isActive('/register'))} aria-label="Registrarse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Registro
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
