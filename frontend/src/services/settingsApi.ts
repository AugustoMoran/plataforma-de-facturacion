import { createApi } from '@reduxjs/toolkit/query/react';
import { createReauthBaseQuery } from './baseQueryWithReauth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface PublicStoreSettings {
  storeName: string;
  storeDescription?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  contactEmail?: string;
  contactPhone?: string;
  currency?: string;
  showPrices?: boolean;
  enableEcommerce?: boolean;
  minOrderAmount?: number;
  freeShippingThreshold?: number;
  defaultShippingCost?: number;
  mercadopagoEnabled?: boolean;
  paywayEnabled?: boolean;
  envioPackEnabled?: boolean;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  bannerImages?: string[];
  promoTripletImages?: string[];
  promoBannerImage?: string;
}

export interface AdminStoreSettings extends PublicStoreSettings {
  usingDefaultBanners?: boolean;
  usingDefaultPromoTriplet?: boolean;
  usingDefaultPromoBanner?: boolean;
}

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: createReauthBaseQuery(`${API_BASE_URL}/settings`),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getPublicSettings: builder.query<PublicStoreSettings, void>({
      query: () => '/public',
      providesTags: ['Settings'],
    }),
    getAdminSettings: builder.query<AdminStoreSettings, void>({
      query: () => '/',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<AdminStoreSettings, Partial<AdminStoreSettings>>({
      query: (body) => ({
        url: '/',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
    uploadBannerImages: builder.mutation<{ bannerImages: string[]; message: string }, FormData>({
      query: (formData) => ({
        url: '/banners',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Settings'],
    }),
    clearBannerImages: builder.mutation<{ bannerImages: string[]; message: string }, void>({
      query: () => ({
        url: '/banners',
        method: 'DELETE',
      }),
      invalidatesTags: ['Settings'],
    }),
    uploadPromoTripletImages: builder.mutation<{ promoTripletImages: string[]; message: string }, FormData>({
      query: (formData) => ({
        url: '/promo-triplet',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Settings'],
    }),
    clearPromoTripletImages: builder.mutation<{ promoTripletImages: string[]; message: string }, void>({
      query: () => ({
        url: '/promo-triplet',
        method: 'DELETE',
      }),
      invalidatesTags: ['Settings'],
    }),
    uploadPromoBannerImage: builder.mutation<{ promoBannerImage: string; message: string }, FormData>({
      query: (formData) => ({
        url: '/promo-banner',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Settings'],
    }),
    clearPromoBannerImage: builder.mutation<{ promoBannerImage: string; message: string }, void>({
      query: () => ({
        url: '/promo-banner',
        method: 'DELETE',
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetPublicSettingsQuery,
  useGetAdminSettingsQuery,
  useUpdateSettingsMutation,
  useUploadBannerImagesMutation,
  useClearBannerImagesMutation,
  useUploadPromoTripletImagesMutation,
  useClearPromoTripletImagesMutation,
  useUploadPromoBannerImageMutation,
  useClearPromoBannerImageMutation,
} = settingsApi;
