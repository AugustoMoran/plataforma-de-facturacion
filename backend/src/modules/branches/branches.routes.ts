import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { branchesController } from './branches.controller';

const router: ExpressRouter = Router();
router.use(authenticate);

router.get('/', requirePermission('viewBranches'), branchesController.getAll.bind(branchesController));
router.get('/:id', requirePermission('viewBranches'), branchesController.getById.bind(branchesController));
router.get('/:id/vendedores', requirePermission('viewBranches'), branchesController.getVendedores.bind(branchesController));

router.post(
  '/',
  requirePermission('manageBranches'),
  [
    body('name').notEmpty().trim(),
    body('address').notEmpty().trim(),
    body('phone').optional().trim(),
    body('email').optional().isEmail(),
  ],
  validate,
  branchesController.create.bind(branchesController),
);

router.patch('/:id', requirePermission('manageBranches'), branchesController.update.bind(branchesController));
router.post('/:id/vendedores', requirePermission('manageBranches'), [body('userId').isMongoId()], validate, branchesController.assignVendedor.bind(branchesController));
router.delete('/:id', requirePermission('manageBranches'), branchesController.delete.bind(branchesController));

export default router;
