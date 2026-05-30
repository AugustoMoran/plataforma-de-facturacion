import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';

import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { usersController } from './users.controller';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get('/', requirePermission('viewUsers'), usersController.getAll.bind(usersController));
router.get('/:id', requirePermission('viewUsers'), usersController.getById.bind(usersController));

router.post(
  '/',
  requirePermission('createUsers'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('roleId').isMongoId(),
    body('branchId').optional().isMongoId(),
    body('commissionPercentage').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  usersController.create.bind(usersController),
);

router.patch(
  '/:id',
  requirePermission('editUsers'),
  [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('roleId').optional().isMongoId(),
    body('branchId').optional().isMongoId(),
    body('commissionPercentage').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  usersController.update.bind(usersController),
);

router.patch(
  '/:id/password',
  requirePermission('editUsers'),
  [body('password').isLength({ min: 8 })],
  validate,
  usersController.updatePassword.bind(usersController),
);

router.delete('/:id', requirePermission('deleteUsers'), usersController.delete.bind(usersController));

export default router;
