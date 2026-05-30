import { Router, type Router as ExpressRouter } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { reportsController } from './reports.controller';

const router: ExpressRouter = Router();
router.use(authenticate, requirePermission('viewReports'));

router.get('/sales', reportsController.getSales.bind(reportsController));
router.get('/sellers', reportsController.getSellers.bind(reportsController));
router.get('/products', reportsController.getProducts.bind(reportsController));
router.get('/stock', reportsController.getStock.bind(reportsController));

export default router;
