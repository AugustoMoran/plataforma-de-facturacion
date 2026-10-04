import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { selectCartCount, toggleCart } from '../../store/cartSlice';
import { isCustomerRole, isStaffRole } from './RouteGuards';
import { BrandLogo } from '../BrandLogo';
import { StoreSearchBar } from './StoreSearchBar';
import { useStoreLogout } from '../../hooks/useStoreLogout';

export const StoreHeader: React.FC = () => {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const { user } = useSelector((state: RootState) => state.auth);
  const isStaff = user && isStaffRole(user.roles);
  const { logout, isLoggingOut } = useStoreLogout();

  return (
    <header className="sticky top-0 z-40 bg-blue-950/35 backdrop-blur-md border-b border-blue-200/25 shadow-lg shadow-blue-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link to="/" className="flex-shrink-0 min-w-0">
            <BrandLogo size="lg" className="[&_span]:text-white" />
          </Link>

          <div className="flex-1 min-w-0 max-w-2xl mx-auto hidden sm:block">
            <StoreSearchBar />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {isStaff ? (
              <Link
                to="/dashboard"
                className="btn-secondary !py-2 !px-2.5 sm:!px-3 text-xs inline-flex items-center gap-1.5"
                aria-label="Ir al panel de administración"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
                <span>Panel</span>
              </Link>
            ) : !user ? (
              <>
                <Link
                  to="/ingresar"
                  className="btn-secondary !py-2 !px-2.5 sm:!px-3 text-xs inline-flex items-center gap-1.5"
                  aria-label="Ingresar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Ingresar</span>
                </Link>
                <Link
                  to="/register"
                  className="btn-primary !py-2 !px-2.5 text-xs inline-flex items-center gap-1.5"
                  aria-label="Registrarse"
                >
                  <span className="hidden sm:inline">Registrarse</span>
                  <span className="sm:hidden">Registro</span>
                </Link>
              </>
          ) : (
            <>
              {isCustomerRole(user.roles) && (
                <>
                  <Link
                    to="/account/orders"
                    className="btn-icon sm:hidden"
                    aria-label="Mis pedidos"
                    title="Mis pedidos"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </Link>
                  <Link
                    to="/account"
                    className="btn-icon sm:hidden"
                    aria-label="Mi cuenta"
                    title="Mi cuenta"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <Link to="/account/orders" className="btn-secondary !py-2 !px-3 text-xs hidden sm:inline-flex">
                    Mis pedidos
                  </Link>
                  <Link to="/account" className="btn-secondary !py-2 !px-3 text-xs hidden sm:inline-flex">
                    Mi cuenta
                  </Link>
                </>
              )}
              <span className="text-xs text-blue-100 hidden lg:inline truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="btn-icon"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}

            <button
              onClick={() => dispatch(toggleCart())}
              className="btn-icon relative"
              aria-label="Abrir carrito"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-blue-900 text-[10px] font-bold flex items-center justify-center ring-2 ring-blue-600">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 sm:hidden">
          <StoreSearchBar compact />
        </div>
      </div>
    </header>
  );
};
