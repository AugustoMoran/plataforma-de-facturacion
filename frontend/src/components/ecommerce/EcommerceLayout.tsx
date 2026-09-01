import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { StoreHeader } from './StoreHeader';
import { StoreCategoryNav } from './StoreCategoryNav';
import { CartDrawer } from './CartDrawer';
import { FloatingSocialButtons } from './FloatingSocialButtons';

export const EcommerceLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="store-shell flex flex-col">
      <StoreHeader />
      <StoreCategoryNav />
      <main className="flex-1">
        {isHome ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        )}
      </main>
      <footer className="border-t border-blue-300/25 py-6 mt-auto bg-blue-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-blue-100/80 space-y-2">
          <p>© {new Date().getFullYear()} {(import.meta as any).env?.VITE_COMPANY_NAME || 'Tienda'}. Todos los derechos reservados.</p>
          <p>
            <Link to="/login" className="text-white/90 hover:text-white underline-offset-2 hover:underline">
              Acceso administración
            </Link>
          </p>
        </div>
      </footer>
      <CartDrawer />
      <FloatingSocialButtons />
    </div>
  );
};
