import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';

import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rate-limit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authController } from './auth.controller';

const router: ExpressRouter = Router();

router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authController.login.bind(authController),
);

router.post('/refresh', authController.refresh.bind(authController));

router.post('/logout', authController.logout.bind(authController));

router.post('/logout-all', authenticate, authController.logoutAll.bind(authController));

router.get('/me', authenticate, authController.me.bind(authController));

export default router;
