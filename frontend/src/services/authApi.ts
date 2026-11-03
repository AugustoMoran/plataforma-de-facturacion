import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AuthUser } from '../store/authSlice';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth`,
    credentials: 'include',
  }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    login: builder.mutation<{ user: AuthUser }, { email: string; password: string }>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getRegisterSetup: builder.query<
      { staffBootstrapOpen: boolean; storeRegistrationAvailable: boolean },
      void
    >({
      query: () => 'register/setup',
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: 'register',
        method: 'POST',
        body: userData,
      }),
    }),
    publicRegister: builder.mutation<
      {
        user: AuthUser;
        verificationEmailSent?: boolean;
        emailDeliverability?: 'ok' | 'institutional';
      },
      {
        name: string;
        email: string;
        password: string;
        phone?: string;
        shippingAddress: {
          street: string;
          city: string;
          province: string;
          postalCode: string;
          country?: string;
        };
        marketingOptIn?: boolean;
      }
    >({
      query: (body) => ({
        url: 'register/public',
        method: 'POST',
        body,
      }),
    }),
    updateProfile: builder.mutation<AuthUser, Partial<{
      name: string;
      phone: string;
      marketingOptIn: boolean;
      defaultShippingAddress: AuthUser['defaultShippingAddress'];
    }>>({
      query: (body) => ({
        url: 'profile',
        method: 'PATCH',
        body,
      }),
    }),
    verifyEmail: builder.mutation<{ ok: boolean; user: AuthUser }, string>({
      query: (token) => ({
        url: `verify-email?token=${encodeURIComponent(token)}`,
        method: 'GET',
      }),
    }),
    resendVerification: builder.mutation<
      {
        mailerConfigured: boolean;
        mailSent?: boolean;
        alreadyVerified?: boolean;
        sentTo?: string;
      },
      void
    >({
      query: () => ({
        url: 'resend-verification',
        method: 'POST',
      }),
    }),
    changeCustomerEmail: builder.mutation<
      {
        user: AuthUser;
        verificationEmailSent?: boolean;
        emailDeliverability?: 'ok' | 'institutional';
      },
      { newEmail: string }
    >({
      query: (body) => ({
        url: 'customer-email',
        method: 'PATCH',
        body,
      }),
    }),
    getStoreCustomers: builder.query<any[], void>({
      query: () => 'customers',
      providesTags: ['Users'],
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query<AuthUser, void>({
      query: () => '/me',
    }),
    refresh: builder.mutation<{ user: AuthUser }, void>({
      query: () => ({
        url: 'refresh',
        method: 'POST',
      }),
    }),
    getUsers: builder.query<any[], void>({
      query: () => 'users',
      providesTags: ['Users'],
    }),
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
    updatePermissions: builder.mutation({
      query: (data) => ({
        url: 'users/permissions',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    updateCommission: builder.mutation({
      query: (data) => ({
        url: 'users/commission',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    updateBranch: builder.mutation({
      query: (data) => ({
        url: 'users/branch',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetRegisterSetupQuery,
  useRegisterMutation,
  usePublicRegisterMutation,
  useUpdateProfileMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useChangeCustomerEmailMutation,
  useGetStoreCustomersQuery,
  useLogoutMutation,
  useGetMeQuery,
  useRefreshMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useUpdatePermissionsMutation,
  useUpdateCommissionMutation,
  useUpdateBranchMutation,
} = authApi;
