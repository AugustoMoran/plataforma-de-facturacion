import { NextFunction, Request, Response } from 'express';
import { Router, type Router as ExpressRouter } from 'express';
import { body } from 'express-validator';

import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { categoriesService } from './categories.service';

class CategoriesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query as Record<string, string>;
      const result = await categoriesService.getAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.create(req.body);
      res.status(201).json({ success: true, data: category, message: 'Category created' });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.update(req.params['id']!, req.body);
      res.status(200).json({ success: true, data: category });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoriesService.delete(req.params['id']!);
      res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (err) { next(err); }
  }
}

const controller = new CategoriesController();
const router: ExpressRouter = Router();

router.use(authenticate);
router.get('/', controller.getAll.bind(controller));
router.post('/', requirePermission('manageCategories'), [body('name').notEmpty().trim()], validate, controller.create.bind(controller));
router.patch('/:id', requirePermission('manageCategories'), controller.update.bind(controller));
router.delete('/:id', requirePermission('manageCategories'), controller.delete.bind(controller));

export default router;
