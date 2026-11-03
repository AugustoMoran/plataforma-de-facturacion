import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StoreHeader } from './StoreHeader';
import { StoreCategoryNav } from './StoreCategoryNav';
import { CartDrawer } from './CartDrawer';
import { FloatingSocialButtons } from './FloatingSocialButtons';
import { StoreFooter } from './StoreFooter';
import { StoreMobileBottomNav } from './StoreMobileBottomNav';

export const EcommerceLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="store-shell flex flex-col">
      <StoreHeader />
      <StoreCategoryNav />
      <main className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
        {isHome ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        )}
      </main>
      <StoreFooter />
      <StoreMobileBottomNav />
      <CartDrawer />
      <FloatingSocialButtons />
    </div>
  );
};
