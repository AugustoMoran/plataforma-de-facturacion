import { Router } from 'express';
import {
  createDispatchController,
  envioPackWebhookController,
  getProvincesController,
  getShippingStatusController,
  listDispatchController,
  quoteShippingController,
  refreshDispatchController,
} from '../controllers/shippingController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { PERMISSIONS } from '../../auth/constants/permissions';

const router = Router();

router.get('/status', getShippingStatusController);
router.get('/provinces', getProvincesController);
router.post('/quote', quoteShippingController);
router.get('/enviopack/webhook', envioPackWebhookController);

router.get('/dispatch', authenticate, authorize(PERMISSIONS.SALES_VIEW), listDispatchController);
router.post('/dispatch/:saleId', authenticate, authorize(PERMISSIONS.SALES_EDIT), createDispatchController);
router.post('/dispatch/:saleId/refresh', authenticate, authorize(PERMISSIONS.SALES_EDIT), refreshDispatchController);

export default router;
