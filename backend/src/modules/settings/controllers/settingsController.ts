import { Request, Response } from 'express';
import * as settingsService from '../services/settingsService';
import {
  resolveBannerImages,
  resolvePromoBannerImage,
  resolvePromoTripletImages,
} from '../services/settingsService';
import { extractPromoTripletSlotUrls, extractUploadedBannerUrls } from '../utils/bannerUploadParser';

export const getPublicSettingsController = async (_req: Request, res: Response) => {
  try {
    const settings = await settingsService.getPublicSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettingsController = async (_req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();
    const doc = settings.toObject ? settings.toObject() : settings;
    res.json({
      ...doc,
      bannerImages: resolveBannerImages(doc.bannerImages),
      usingDefaultBanners: !(doc.bannerImages || []).filter(Boolean).length,
      promoTripletImages: resolvePromoTripletImages(doc.promoTripletImages),
      usingDefaultPromoTriplet: !(doc.promoTripletImages || []).filter(Boolean).length,
      promoBannerImage: resolvePromoBannerImage(doc.promoBannerImage),
      usingDefaultPromoBanner: !(doc.promoBannerImage || '').trim(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettingsController = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.updateSettings(req.body || {});
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadBannerImagesController = async (req: Request, res: Response) => {
  try {
    const urls = extractUploadedBannerUrls(req);
    if (!urls.length) {
      return res.status(400).json({ message: 'No se recibieron imágenes válidas' });
    }

    const settings = await settingsService.replaceBannerImages(urls);
    res.json({
      bannerImages: settings.bannerImages,
      usingDefaultBanners: false,
      message: 'Carrusel actualizado correctamente',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const clearBannerImagesController = async (_req: Request, res: Response) => {
  try {
    await settingsService.clearBannerImages();
    res.json({
      bannerImages: resolveBannerImages([]),
      usingDefaultBanners: true,
      message: 'Carrusel restaurado a imágenes por defecto',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadPromoTripletImagesController = async (req: Request, res: Response) => {
  try {
    const settingsDoc = await settingsService.getSettings();
    const currentUrls = resolvePromoTripletImages(settingsDoc.promoTripletImages);
    const slotUrls = extractPromoTripletSlotUrls(req);

    const mergedUrls = [0, 1, 2].map((index) => slotUrls[index] || currentUrls[index] || '');
    if (!mergedUrls.every(Boolean)) {
      return res.status(400).json({
        message:
          'Completá las 3 posiciones del banner triple. Podés cambiar una sola y conservar las demás.',
      });
    }

    const settings = await settingsService.replacePromoTripletImages(mergedUrls);
    res.json({
      promoTripletImages: settings.promoTripletImages,
      usingDefaultPromoTriplet: false,
      message: 'Banner triple actualizado correctamente',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const clearPromoTripletImagesController = async (_req: Request, res: Response) => {
  try {
    await settingsService.clearPromoTripletImages();
    res.json({
      promoTripletImages: resolvePromoTripletImages([]),
      usingDefaultPromoTriplet: true,
      message: 'Banner triple restaurado a imágenes por defecto',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadPromoBannerImageController = async (req: Request, res: Response) => {
  try {
    const urls = extractUploadedBannerUrls(req);
    if (!urls.length) {
      return res.status(400).json({ message: 'No se recibió una imagen válida' });
    }

    const settings = await settingsService.replacePromoBannerImage(urls[0]);
    res.json({
      promoBannerImage: settings.promoBannerImage,
      usingDefaultPromoBanner: false,
      message: 'Banner promocional actualizado correctamente',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const clearPromoBannerImageController = async (_req: Request, res: Response) => {
  try {
    await settingsService.clearPromoBannerImage();
    res.json({
      promoBannerImage: resolvePromoBannerImage(''),
      usingDefaultPromoBanner: true,
      message: 'Banner promocional restaurado a imagen por defecto',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
