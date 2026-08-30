import { Router } from 'express';
import {
  getPaywayConfigController,
  createPaywayCheckoutController,
  paywayWebhookController,
  getPaywayPaymentStatusController,
  syncPaywaySaleStatusController,
} from '../controllers/paymentsController';

const router = Router();

router.get('/payway/config', getPaywayConfigController);
router.post('/payway/checkout', createPaywayCheckoutController);
router.post('/payway/webhook', paywayWebhookController);
router.get('/payway/payment/:paymentId', getPaywayPaymentStatusController);
router.get('/payway/sync/:saleId', syncPaywaySaleStatusController);

export default router;
