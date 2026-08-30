import StoreSettings, { IStoreSettings } from '../models/StoreSettings';
import {
  DEFAULT_BANNER_IMAGES,
  DEFAULT_PROMO_BANNER_IMAGE,
  DEFAULT_PROMO_TRIPLET_IMAGES,
  MAX_BANNER_IMAGES,
} from '../constants/defaultBannerImages';

const SETTINGS_ID = 'store-settings';

export const resolveBannerImages = (bannerImages: string[] = []) => {
  const custom = (bannerImages || []).filter(Boolean);
  return custom.length > 0 ? custom : DEFAULT_BANNER_IMAGES;
};

export const resolvePromoTripletImages = (promoTripletImages: string[] = []) => {
  const custom = (promoTripletImages || []).filter(Boolean);
  return custom.length > 0 ? custom : DEFAULT_PROMO_TRIPLET_IMAGES;
};

export const resolvePromoBannerImage = (promoBannerImage?: string) => {
  const custom = (promoBannerImage || '').trim();
  return custom || DEFAULT_PROMO_BANNER_IMAGE;
};

const getSettingsDoc = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
};

export const getPublicSettings = async () => {
  const settings = await getSettingsDoc();
  return {
    storeName: settings.storeName,
    storeDescription: settings.storeDescription,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    enableEcommerce: settings.enableEcommerce,
    maintenanceMode: settings.maintenanceMode,
    minOrderAmount: settings.minOrderAmount,
    freeShippingThreshold: settings.freeShippingThreshold,
    defaultShippingCost: settings.defaultShippingCost,
    mercadopagoEnabled: settings.mercadopagoEnabled,
    envioPackEnabled: settings.envioPackEnabled,
    socialLinks: settings.socialLinks,
    bannerImages: resolveBannerImages(settings.bannerImages),
    promoTripletImages: resolvePromoTripletImages(settings.promoTripletImages),
    promoBannerImage: resolvePromoBannerImage(settings.promoBannerImage),
  };
};

export const getSettings = async () => {
  return await getSettingsDoc();
};

export const updateSettings = async (payload: Partial<IStoreSettings>) => {
  const settings = await getSettingsDoc();
  const allowed = [
    'storeName', 'storeDescription', 'contactEmail', 'contactPhone',
    'enableEcommerce', 'maintenanceMode', 'minOrderAmount', 'freeShippingThreshold',
    'defaultShippingCost', 'mercadopagoEnabled', 'envioPackEnabled', 'defaultBranch',
    'socialLinks', 'bannerImages', 'promoTripletImages', 'promoBannerImage',
  ];

  for (const key of allowed) {
    if (payload[key as keyof IStoreSettings] !== undefined) {
      (settings as any)[key] = payload[key as keyof IStoreSettings];
    }
  }

  await settings.save();
  return settings;
};

export const replaceBannerImages = async (urls: string[]) => {
  if (!urls.length) {
    throw new Error('Debe subir al menos una imagen');
  }
  if (urls.length > MAX_BANNER_IMAGES) {
    throw new Error(`Máximo ${MAX_BANNER_IMAGES} imágenes en el carrusel`);
  }

  const settings = await getSettingsDoc();
  settings.bannerImages = urls;
  await settings.save();
  return settings;
};

export const clearBannerImages = async () => {
  const settings = await getSettingsDoc();
  settings.bannerImages = [];
  await settings.save();
  return settings;
};

export const MAX_PROMO_TRIPLET_IMAGES = 3;

export const replacePromoTripletImages = async (urls: string[]) => {
  if (!urls.length) {
    throw new Error('Debe subir al menos una imagen');
  }
  if (urls.length > MAX_PROMO_TRIPLET_IMAGES) {
    throw new Error(`Máximo ${MAX_PROMO_TRIPLET_IMAGES} imágenes en el banner triple`);
  }

  const settings = await getSettingsDoc();
  settings.promoTripletImages = urls;
  await settings.save();
  return settings;
};

export const clearPromoTripletImages = async () => {
  const settings = await getSettingsDoc();
  settings.promoTripletImages = [];
  await settings.save();
  return settings;
};

export const replacePromoBannerImage = async (url: string) => {
  if (!url) {
    throw new Error('Debe subir una imagen');
  }

  const settings = await getSettingsDoc();
  settings.promoBannerImage = url;
  await settings.save();
  return settings;
};

export const clearPromoBannerImage = async () => {
  const settings = await getSettingsDoc();
  settings.promoBannerImage = undefined;
  await settings.save();
  return settings;
};

export const SETTINGS_SINGLETON_ID = SETTINGS_ID;
