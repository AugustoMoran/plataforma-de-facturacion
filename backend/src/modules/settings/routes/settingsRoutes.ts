import { Router } from 'express';
import {
  getPublicSettingsController,
  getSettingsController,
  updateSettingsController,
  uploadBannerImagesController,
  clearBannerImagesController,
  uploadPromoTripletImagesController,
  clearPromoTripletImagesController,
  uploadPromoBannerImageController,
  clearPromoBannerImageController,
} from '../controllers/settingsController';
import { authenticate } from '../../../middleware/authMiddleware';
import { authorize } from '../../../middleware/roleMiddleware';
import { bannerUpload } from '../../../middleware/uploadMiddleware';

const router = Router();

router.get('/public', getPublicSettingsController);
router.get('/', authenticate, authorize(['admin']), getSettingsController);
router.put('/', authenticate, authorize(['admin']), updateSettingsController);
router.post(
  '/banners',
  authenticate,
  authorize(['admin']),
  bannerUpload.array('banners', 10),
  uploadBannerImagesController
);
router.delete('/banners', authenticate, authorize(['admin']), clearBannerImagesController);
router.post(
  '/promo-triplet',
  authenticate,
  authorize(['admin']),
  bannerUpload.fields([
    { name: 'slot0', maxCount: 1 },
    { name: 'slot1', maxCount: 1 },
    { name: 'slot2', maxCount: 1 },
  ]),
  uploadPromoTripletImagesController
);
router.delete('/promo-triplet', authenticate, authorize(['admin']), clearPromoTripletImagesController);
router.post(
  '/promo-banner',
  authenticate,
  authorize(['admin']),
  bannerUpload.single('promo'),
  uploadPromoBannerImageController
);
router.delete('/promo-banner', authenticate, authorize(['admin']), clearPromoBannerImageController);

export default router;
