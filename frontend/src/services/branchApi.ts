import { createApi } from '@reduxjs/toolkit/query/react';
import { createReauthBaseQuery } from './baseQueryWithReauth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface PublicBranch {
  _id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isMain?: boolean;
}

export const branchApi = createApi({
  reducerPath: 'branchApi',
  baseQuery: createReauthBaseQuery(`${API_BASE_URL}/branches`),
  tagTypes: ['Branch'],
  endpoints: (builder) => ({
    getPublicBranches: builder.query<PublicBranch[], void>({
      query: () => '/public',
    }),
    getBranches: builder.query<any[], any>({
      query: () => '/',
      providesTags: ['Branch'],
    }),
    createBranch: builder.mutation({
      query: (newBranch) => ({
        url: '/',
        method: 'POST',
        body: newBranch,
      }),
      invalidatesTags: ['Branch'],
    }),
    updateBranch: builder.mutation({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Branch'],
    }),
    deleteBranch: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branch'],
    }),
  }),
});

export const {
  useGetPublicBranchesQuery,
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchApi;