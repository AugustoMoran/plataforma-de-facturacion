import { apiSlice } from './apiSlice';
import type { PaginatedResponse } from '../types';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: { url: string; publicId: string };
  imageUrl?: string;
  categoryId: string | { _id: string; name: string };
  barcode?: string;
  internalCode?: string;
  cost: number;
  ivaPercentage: number;
  profitPercentage: number;
  publicPrice: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  categoryId: string;
  barcode?: string;
  internalCode?: string;
  cost: number;
  ivaPercentage: number;
  profitPercentage?: number;
  publicPrice?: number;
  minStock?: number;
}

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      PaginatedResponse<Product>,
      { page?: number; limit?: number; search?: string; categoryId?: string }
    >({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map(({ _id }) => ({ type: 'Product' as const, id: _id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProductById: builder.query<{ success: boolean; data: Product }, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    getProductByBarcode: builder.query<{ success: boolean; data: Product }, string>({
      query: (barcode) => `/products/barcode/${barcode}`,
    }),

    createProduct: builder.mutation<{ success: boolean; data: Product }, FormData | CreateProductDto>({
      query: (payload) => ({
        url: '/products',
        method: 'POST',
        body: payload,
        ...(payload instanceof FormData
          ? {
              prepareHeaders: (headers: Headers) => {
                headers.delete('Content-Type');
                return headers;
              },
            }
          : {}),
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<
      { success: boolean; data: Product },
      { id: string; data: FormData | Partial<CreateProductDto> }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),

    deleteProduct: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    calculatePrice: builder.mutation<
      { success: boolean; data: { publicPrice?: number; profitPercentage?: number } },
      { cost: number; ivaPercentage: number; profitPercentage?: number; publicPrice?: number }
    >({
      query: (data) => ({
        url: '/products/calculate-price',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductByBarcodeQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCalculatePriceMutation,
} = productsApi;
