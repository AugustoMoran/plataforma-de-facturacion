import { apiSlice } from './apiSlice';
import type { PaginatedResponse } from '../types';

export interface StockItem {
  _id: string;
  productId: { _id: string; name: string; sku?: string; barcode?: string };
  branchId: { _id: string; name: string };
  quantity: number;
  minStock: number;
  location?: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  productId: { _id: string; name: string };
  branchId: { _id: string; name: string };
  type: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason?: string;
  userId: { _id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface AdjustStockDto {
  productId: string;
  branchId: string;
  quantity: number;
  type: 'MANUAL_ADJUSTMENT' | 'RETURN';
  reason?: string;
}

export interface TransferStockDto {
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  notes?: string;
}

export const stockApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<
      { success: boolean; data: StockItem[] },
      { branchId?: string; lowStock?: boolean }
    >({
      query: (params) => ({ url: '/stock', params }),
      providesTags: [{ type: 'Stock', id: 'LIST' }],
    }),

    getStockMovements: builder.query<
      PaginatedResponse<StockMovement>,
      { productId?: string; branchId?: string; type?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: '/stock/movements', params }),
      providesTags: [{ type: 'Stock', id: 'MOVEMENTS' }],
    }),

    adjustStock: builder.mutation<{ success: boolean }, AdjustStockDto>({
      query: (data) => ({ url: '/stock/adjust', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Stock', id: 'LIST' }, { type: 'Stock', id: 'MOVEMENTS' }],
    }),

    transferStock: builder.mutation<{ success: boolean }, TransferStockDto>({
      query: (data) => ({ url: '/stock/transfer', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Stock', id: 'LIST' }, { type: 'Stock', id: 'MOVEMENTS' }],
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockMovementsQuery,
  useAdjustStockMutation,
  useTransferStockMutation,
} = stockApi;
