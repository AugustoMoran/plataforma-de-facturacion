import { createApi } from '@reduxjs/toolkit/query/react';
import { createReauthBaseQuery } from './baseQueryWithReauth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: createReauthBaseQuery(`${API_BASE_URL}/payments`),
  endpoints: (builder) => ({
    getPaywayConfig: builder.query<{ publicKey: string; enabled: boolean; environment?: string }, void>({
      query: () => '/payway/config',
    }),
    createPaywayCheckout: builder.mutation<
      { id: string; checkoutUrl: string; transactionId?: string },
      { saleId: string; payerEmail?: string }
    >({
      query: (body) => ({
        url: '/payway/checkout',
        method: 'POST',
        body,
      }),
    }),
    syncPaywaySaleStatus: builder.query<
      { saleId: string; paymentStatus: string; paymentId?: string; rawStatus?: string },
      string
    >({
      query: (saleId) => `/payway/sync/${saleId}`,
    }),
  }),
});

export const {
  useGetPaywayConfigQuery,
  useCreatePaywayCheckoutMutation,
  useLazySyncPaywaySaleStatusQuery,
} = paymentsApi;
