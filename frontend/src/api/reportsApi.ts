import { apiSlice } from './apiSlice';

export interface DailySalesReport {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalIva: number;
  totalCommissions: number;
  salesByType: { facturada: number; noFacturada: number };
  salesByStatus: Record<string, number>;
}

export interface SellerReport {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
}

export interface StockReport {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  stockByBranch: Array<{
    branchId: string;
    branchName: string;
    totalProducts: number;
    totalStock: number;
  }>;
}

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDailySales: builder.query<
      { success: boolean; data: DailySalesReport },
      { dateFrom?: string; dateTo?: string; branchId?: string }
    >({
      query: (params) => ({ url: '/reports/sales/daily', params }),
      providesTags: ['Report'],
    }),

    getSellerReport: builder.query<
      { success: boolean; data: SellerReport[] },
      { dateFrom?: string; dateTo?: string; branchId?: string }
    >({
      query: (params) => ({ url: '/reports/sales/by-seller', params }),
      providesTags: ['Report'],
    }),

    getStockReport: builder.query<
      { success: boolean; data: StockReport },
      { branchId?: string }
    >({
      query: (params) => ({ url: '/reports/stock', params }),
      providesTags: ['Report'],
    }),
  }),
});

export const {
  useGetDailySalesQuery,
  useGetSellerReportQuery,
  useGetStockReportQuery,
} = reportsApi;
