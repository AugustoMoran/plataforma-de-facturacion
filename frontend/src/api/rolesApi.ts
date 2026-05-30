import { apiSlice } from './apiSlice';
import type { PaginatedResponse, PermissionsMap } from '../types';

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  permissions: PermissionsMap;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  permissions: PermissionsMap;
}

export const rolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<PaginatedResponse<Role>, { page?: number; limit?: number }>({
      query: (params) => ({ url: '/roles', params }),
      providesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    getRoleById: builder.query<{ success: boolean; data: Role }, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Role', id }],
    }),

    createRole: builder.mutation<{ success: boolean; data: Role }, CreateRoleDto>({
      query: (data) => ({ url: '/roles', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    updateRole: builder.mutation<
      { success: boolean; data: Role },
      { id: string; data: Partial<CreateRoleDto> }
    >({
      query: ({ id, data }) => ({ url: `/roles/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Role', id }, { type: 'Role', id: 'LIST' }],
    }),

    updateRolePermissions: builder.mutation<
      { success: boolean; data: Role },
      { id: string; permissions: PermissionsMap }
    >({
      query: ({ id, permissions }) => ({
        url: `/roles/${id}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Role', id }, { type: 'Role', id: 'LIST' }],
    }),

    deleteRole: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useUpdateRolePermissionsMutation,
  useDeleteRoleMutation,
} = rolesApi;
