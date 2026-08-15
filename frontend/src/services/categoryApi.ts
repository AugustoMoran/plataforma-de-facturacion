import { createApi } from '@reduxjs/toolkit/query/react';
import { createReauthBaseQuery } from './baseQueryWithReauth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const categoryApi = createApi({
  reducerPath: 'categoryApi',
  baseQuery: createReauthBaseQuery(`${API_BASE_URL}/categories`),
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    getCategories: builder.query<any[], boolean | void>({
      query: (includeInternal) => ({
        url: '/',
        params: includeInternal ? { includeInternal: 'true' } : undefined,
      }),
      providesTags: ['Category'],
    }),
    getOrphanProductCategories: builder.query<string[], void>({
      query: () => '/orphans/products',
      providesTags: ['Category'],
    }),
    repairCategories: builder.mutation<
      { message: string; mergedDuplicates: number; reparentedRoots: number; productsRetagged: number },
      void
    >({
      query: () => ({
        url: '/repair',
        method: 'POST',
      }),
      invalidatesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetOrphanProductCategoriesQuery,
  useRepairCategoriesMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
