import { createApi } from '@reduxjs/toolkit/query/react';
import { createReauthBaseQuery } from './baseQueryWithReauth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface ShippingProvince {
  id: string;
  name: string;
}

export interface ShippingOption {
  id: string;
  modalidad: 'D' | 'S';
  label: string;
  description: string;
  carrierId: string;
  carrierName: string;
  service: string;
  despacho: string;
  customerCost: number;
  sellerCost: number;
  estimatedHours?: number;
  isFree: boolean;
  sucursal?: {
    id: number;
    nombre: string;
    calle: string;
    numero: string;
    localidad: string;
    codigoPostal: string;
    horario?: string;
    correo?: string;
  };
}

export interface ShippingQuoteResponse {
  provider: 'enviopack';
  province: string;
  provinceName: string;
  postalCode: string;
  city?: string;
  weight: number;
  paquetes: string;
  options: ShippingOption[];
  quoteToken: string;
}

export const shippingApi = createApi({
  reducerPath: 'shippingApi',
  baseQuery: createReauthBaseQuery(`${API_BASE_URL}/shipping`),
  tagTypes: ['Dispatch'],
  endpoints: (builder) => ({
    getShippingStatus: builder.query<{ enabled: boolean }, void>({
      query: () => '/status',
    }),
    getProvinces: builder.query<ShippingProvince[], void>({
      query: () => '/provinces',
    }),
    getLocalidades: builder.query<Array<{ id: number; nombre: string }>, string>({
      query: (province) => `/localidades?province=${encodeURIComponent(province)}`,
    }),
    quoteShipping: builder.mutation<
      ShippingQuoteResponse,
      {
        items: Array<{ productId: string; quantity: number }>;
        province: string;
        postalCode: string;
        city?: string;
        localidadId?: number;
        subtotal?: number;
        modalidad?: 'D' | 'S';
      }
    >({
      query: (body) => ({
        url: '/quote',
        method: 'POST',
        body,
      }),
    }),
    getDispatchOrders: builder.query<any[], void>({
      query: () => '/dispatch',
      providesTags: ['Dispatch'],
    }),
    createDispatchShipment: builder.mutation<any, string>({
      query: (saleId) => ({
        url: `/dispatch/${saleId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Dispatch'],
    }),
    refreshDispatchShipment: builder.mutation<any, string>({
      query: (saleId) => ({
        url: `/dispatch/${saleId}/refresh`,
        method: 'POST',
      }),
      invalidatesTags: ['Dispatch'],
    }),
  }),
});

export const {
  useGetShippingStatusQuery,
  useGetProvincesQuery,
  useGetLocalidadesQuery,
  useQuoteShippingMutation,
  useGetDispatchOrdersQuery,
  useCreateDispatchShipmentMutation,
  useRefreshDispatchShipmentMutation,
} = shippingApi;
