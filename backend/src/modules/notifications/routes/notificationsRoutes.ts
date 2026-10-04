import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import {
  getMailerStatusController,
  sendTestEmailController,
} from '../controllers/notificationsController';

const router = Router();

router.get('/mailer-status', authenticate, authorize('admin'), getMailerStatusController);
router.post('/test-email', authenticate, authorize('admin'), sendTestEmailController);

export default router;
