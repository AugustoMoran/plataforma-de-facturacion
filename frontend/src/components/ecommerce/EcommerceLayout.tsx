import React from 'react';
import { Outlet } from 'react-router-dom';
import { StoreHeader } from './StoreHeader';
import { CartDrawer } from './CartDrawer';
import { FloatingSocialButtons } from './FloatingSocialButtons';
import { AndroidAppBanner } from './AndroidAppBanner';

export const EcommerceLayout: React.FC = () => {
  return (
    <div className="store-shell flex flex-col">
      <AndroidAppBanner />
      <StoreHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-blue-300/25 py-6 mt-auto bg-blue-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-blue-100/80">
          © {new Date().getFullYear()} {(import.meta as any).env?.VITE_COMPANY_NAME || 'Tienda'}. Todos los derechos reservados.
        </div>
      </footer>
      <CartDrawer />
      <FloatingSocialButtons />
    </div>
  );
};
