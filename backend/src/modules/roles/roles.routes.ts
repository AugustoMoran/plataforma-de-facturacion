import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';

import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { rolesController } from './roles.controller';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get('/', rolesController.getAll.bind(rolesController));
router.get('/:id', rolesController.getById.bind(rolesController));

router.post(
  '/',
  requirePermission('manageRoles'),
  [
    body('name').notEmpty().trim().toLowerCase(),
    body('displayName').notEmpty().trim(),
    body('permissions').optional().isObject(),
  ],
  validate,
  rolesController.create.bind(rolesController),
);

router.patch(
  '/:id',
  requirePermission('manageRoles'),
  [
    body('displayName').optional().notEmpty().trim(),
    body('permissions').optional().isObject(),
  ],
  validate,
  rolesController.update.bind(rolesController),
);

router.delete('/:id', requirePermission('manageRoles'), rolesController.delete.bind(rolesController));

export default router;
