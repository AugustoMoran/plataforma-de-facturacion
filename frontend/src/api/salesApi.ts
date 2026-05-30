import { apiSlice } from './apiSlice';
import type { PaginatedResponse } from '../types';

export interface Sale {
  _id: string;
  branchId: string | { _id: string; name: string };
  sellerId: string | { _id: string; firstName: string; lastName: string };
  sellerName: string;
  sellerCommissionPercentage: number;
  items: SaleItem[];
  saleType: 'FACTURADA' | 'NO_FACTURADA';
  status: 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';
  subtotal: number;
  totalIva: number;
  totalCost: number;
  totalProfit: number;
  commissionAmount: number;
  total: number;
  customerName?: string;
  customerCuit?: string;
  notes?: string;
  afip?: AfipData;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  ivaPercentage: number;
  ivaAmount: number;
  subtotal: number;
  profitAmount: number;
}

export interface AfipData {
  voucherType: string;
  voucherNumber?: number;
  cae?: string;
  caeDueDate?: string;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'ERROR';
  processedAt?: string;
  errorMessage?: string;
}

export interface CreateSaleDto {
  branchId: string;
  items: Array<{ productId: string; quantity: number }>;
  saleType: 'FACTURADA' | 'NO_FACTURADA';
  customerName?: string;
  customerCuit?: string;
  notes?: string;
  afipVoucherType?: string;
}

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<
      PaginatedResponse<Sale>,
      {
        page?: number;
        limit?: number;
        branchId?: string;
        sellerId?: string;
        status?: string;
        saleType?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >({
      query: (params) => ({ url: '/sales', params }),
      providesTags: [{ type: 'Sale', id: 'LIST' }],
    }),

    getSaleById: builder.query<{ success: boolean; data: Sale }, string>({
      query: (id) => `/sales/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Sale', id }],
    }),

    createSale: builder.mutation<{ success: boolean; data: Sale }, CreateSaleDto>({
      query: (data) => ({ url: '/sales', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Sale', id: 'LIST' }, { type: 'Stock', id: 'LIST' }],
    }),

    cancelSale: builder.mutation<{ success: boolean }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/sales/${id}/cancel`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Sale', id },
        { type: 'Sale', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useCancelSaleMutation,
} = salesApi;
