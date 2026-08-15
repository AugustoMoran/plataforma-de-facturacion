import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { selectCartCount, toggleCart } from '../../store/cartSlice';
import { isStaffRole } from './RouteGuards';
import { BrandLogo } from '../BrandLogo';

export const StoreHeader: React.FC = () => {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blue-100/80 shadow-sm shadow-blue-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 min-h-[4.5rem] flex items-center justify-between gap-4">
        <Link to="/" className="min-w-0">
          <BrandLogo size="lg" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-2 text-sm text-blue-800/70 hover:text-blue-950 rounded-lg hover:bg-blue-50 transition-colors">
            Inicio
          </Link>
          <Link to="/products" className="px-3 py-2 text-sm text-blue-800/70 hover:text-blue-950 rounded-lg hover:bg-blue-50 transition-colors">
            Productos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user && isStaffRole(user.roles) && (
            <Link to="/dashboard" className="btn-secondary !py-2 !px-3 text-xs hidden sm:inline-flex">
              Panel
            </Link>
          )}

          {!user ? (
            <>
              <Link to="/login" className="btn-secondary !py-2 !px-3 text-xs">
                Ingresar
              </Link>
              <Link to="/store/register" className="btn-primary !py-2 !px-3 text-xs hidden sm:inline-flex">
                Registrarse
              </Link>
            </>
          ) : (
            <span className="text-xs text-blue-700/60 hidden sm:inline truncate max-w-[120px]">
              {user.email}
            </span>
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
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
