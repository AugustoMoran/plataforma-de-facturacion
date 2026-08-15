import React from 'react';
import { Outlet } from 'react-router-dom';
import { StoreHeader } from './StoreHeader';
import { CartDrawer } from './CartDrawer';
import { FloatingSocialButtons } from './FloatingSocialButtons';

export const EcommerceLayout: React.FC = () => {
  return (
    <div className="min-h-screen text-blue-950 flex flex-col">
      <StoreHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-blue-100 py-6 mt-auto bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-blue-700/60">
          © {new Date().getFullYear()} {(import.meta as any).env?.VITE_COMPANY_NAME || 'Tienda'}. Todos los derechos reservados.
        </div>
      </footer>
      <CartDrawer />
      <FloatingSocialButtons />
    </div>
  );
};
