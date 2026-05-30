import { Router } from 'express';
import { body } from 'express-validator';

import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { uploadImage } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate.middleware';
import { productsController } from './products.controller';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('viewProducts'), productsController.getAll.bind(productsController));
router.get('/barcode/:barcode', requirePermission('viewProducts'), productsController.getByBarcode.bind(productsController));
router.get('/:id', requirePermission('viewProducts'), productsController.getById.bind(productsController));

router.post('/calculate-price', productsController.calculatePrice.bind(productsController));

router.post(
  '/',
  requirePermission('createProducts'),
  uploadImage,
  [
    body('name').notEmpty().trim(),
    body('categoryId').isMongoId(),
    body('cost').isFloat({ min: 0 }),
    body('ivaPercentage').isFloat({ min: 0 }),
  ],
  validate,
  productsController.create.bind(productsController),
);

router.patch(
  '/:id',
  requirePermission('editProducts'),
  uploadImage,
  validate,
  productsController.update.bind(productsController),
);

router.delete('/:id', requirePermission('deleteProducts'), productsController.delete.bind(productsController));

export default router;
