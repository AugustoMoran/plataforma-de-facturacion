import { Router } from 'express';
import { body } from 'express-validator';

import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { salesController } from './sales.controller';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('viewSales'), salesController.getAll.bind(salesController));
router.get('/:id', requirePermission('viewSales'), salesController.getById.bind(salesController));

router.post(
  '/',
  requirePermission('createSales'),
  [
    body('branchId').isMongoId(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isMongoId(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('saleType').isIn(['FACTURADA', 'NO_FACTURADA']),
    body('customerName').optional().trim(),
    body('customerCuit').optional().trim(),
  ],
  validate,
  salesController.create.bind(salesController),
);

router.patch(
  '/:id/cancel',
  requirePermission('cancelSales'),
  [body('reason').notEmpty()],
  validate,
  salesController.cancel.bind(salesController),
);

export default router;
