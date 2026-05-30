import { apiSlice } from './apiSlice';
import type { PaginatedResponse } from '../types';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string | { _id: string; name: string };
  permissions: Record<string, boolean>;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  branchId?: string;
  commissionPercentage?: number;
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      PaginatedResponse<User>,
      { page?: number; limit?: number; role?: string; branchId?: string }
    >({
      query: (params) => ({ url: '/users', params }),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    getUserById: builder.query<{ success: boolean; data: User }, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<{ success: boolean; data: User }, CreateUserDto>({
      query: (data) => ({ url: '/users', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUser: builder.mutation<
      { success: boolean; data: User },
      { id: string; data: Partial<CreateUserDto> }
    >({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    updateUserPermissions: builder.mutation<
      { success: boolean; data: User },
      { id: string; permissions: Record<string, boolean> }
    >({
      query: ({ id, permissions }) => ({
        url: `/users/${id}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserPermissionsMutation,
  useDeleteUserMutation,
} = usersApi;
