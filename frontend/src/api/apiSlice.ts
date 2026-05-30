import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? '/api';

/**
 * Reads the CSRF token from the csrf-token cookie (set by the backend as non-HttpOnly).
 * The token is sent as the X-CSRF-Token header on every state-changing request.
 */
function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, _api) => {
      headers.set('Content-Type', 'application/json');
      // Attach CSRF token for all requests (server ignores it for safe methods)
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Auth', 'User', 'Role', 'Branch', 'Product', 'Category',
    'Stock', 'StockMovement', 'Sale', 'Transfer', 'Report', 'Notification',
  ],
  endpoints: () => ({}),
});
