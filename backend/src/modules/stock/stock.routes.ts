import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';

import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { stockController } from './stock.controller';

const router: ExpressRouter = Router();
router.use(authenticate);

router.get('/branch/:branchId', requirePermission('viewStock'), stockController.getByBranch.bind(stockController));
router.get('/product/:productId', requirePermission('viewStock'), stockController.getProductStock.bind(stockController));
router.get('/movements', requirePermission('viewStock'), stockController.getMovements.bind(stockController));

router.post(
  '/adjust',
  requirePermission('adjustStock'),
  [
    body('productId').isMongoId(),
    body('branchId').isMongoId(),
    body('quantity').isNumeric(),
    body('type').isIn(['MANUAL_ADJUSTMENT', 'INITIAL']),
  ],
  validate,
  stockController.adjust.bind(stockController),
);

router.post(
  '/transfer',
  requirePermission('transferStock'),
  [
    body('fromBranchId').isMongoId(),
    body('toBranchId').isMongoId(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isMongoId(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  validate,
  stockController.transfer.bind(stockController),
);

export default router;
