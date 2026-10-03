import { Store } from '@reduxjs/toolkit';
import { RootState } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const isStoreCustomer = (roles: string[] = []) => {
  const normalized = roles.map((r) => String(r).toLowerCase());
  const isStaff = normalized.some((r) => r === 'admin' || r === 'vendedor');
  return normalized.includes('user') && !isStaff;
};

export const syncCustomerCartWithServer = async (store: Store<RootState>) => {
  const state = store.getState();
  const user = state.auth.user;
  if (!user || !isStoreCustomer(user.roles)) return;

  const items = state.cart.items;
  if (!items.length) return;

  await fetch(`${API_BASE_URL}/ecommerce/cart/sync`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }),
  });
};
