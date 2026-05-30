import { apiSlice } from './apiSlice';
import type { PaginatedResponse } from '../types';

export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchDto {
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

export const branchesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<
      PaginatedResponse<Branch>,
      { page?: number; limit?: number; active?: boolean }
    >({
      query: (params) => ({ url: '/branches', params }),
      providesTags: [{ type: 'Branch', id: 'LIST' }],
    }),

    getBranchById: builder.query<{ success: boolean; data: Branch }, string>({
      query: (id) => `/branches/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Branch', id }],
    }),

    createBranch: builder.mutation<{ success: boolean; data: Branch }, CreateBranchDto>({
      query: (data) => ({ url: '/branches', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }],
    }),

    updateBranch: builder.mutation<
      { success: boolean; data: Branch },
      { id: string; data: Partial<CreateBranchDto> }
    >({
      query: ({ id, data }) => ({ url: `/branches/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Branch', id }, { type: 'Branch', id: 'LIST' }],
    }),

    deleteBranch: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/branches/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }],
    }),

    assignVendor: builder.mutation<{ success: boolean }, { branchId: string; userId: string }>({
      query: ({ branchId, userId }) => ({
        url: `/branches/${branchId}/assign-vendor`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_r, _e, { branchId }) => [{ type: 'Branch', id: branchId }],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useAssignVendorMutation,
} = branchesApi;
