import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? '/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Auth', 'User', 'Role', 'Branch', 'Product', 'Category',
    'Stock', 'StockMovement', 'Sale', 'Transfer', 'Report', 'Notification',
  ],
  endpoints: () => ({}),
});
