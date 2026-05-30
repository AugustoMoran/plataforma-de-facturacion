import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCsrfToken: builder.query<{ csrfToken: string }, void>({
      query: () => '/csrf-token',
    }),

    login: builder.mutation<
      { success: boolean; data: { user: User } },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),

    refreshToken: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),

    getMe: builder.query<{ success: boolean; data: User }, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useGetCsrfTokenQuery,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
} = authApi;

// Types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
  permissions: Record<string, boolean>;
  commissionPercentage: number;
}
