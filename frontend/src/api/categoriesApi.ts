import { apiSlice } from './apiSlice';
import type { PaginatedResponse } from '../types';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export const categoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<
      PaginatedResponse<Category>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({ url: '/categories', params }),
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    createCategory: builder.mutation<
      { success: boolean; data: Category },
      { name: string; description?: string }
    >({
      query: (data) => ({ url: '/categories', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    updateCategory: builder.mutation<
      { success: boolean; data: Category },
      { id: string; name?: string; description?: string }
    >({
      query: ({ id, ...data }) => ({ url: `/categories/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    deleteCategory: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
