import { NextFunction, Request, Response } from 'express';
import { rolesService } from './roles.service';

export class RolesController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await rolesService.getAll();
      res.status(200).json({ success: true, data: roles });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await rolesService.getById(req.params['id']!);
      res.status(200).json({ success: true, data: role });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await rolesService.create(req.body);
      res.status(201).json({ success: true, data: role, message: 'Role created' });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await rolesService.update(req.params['id']!, req.body);
      res.status(200).json({ success: true, data: role, message: 'Role updated' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await rolesService.delete(req.params['id']!);
      res.status(200).json({ success: true, message: 'Role deleted' });
    } catch (err) { next(err); }
  }
}

export const rolesController = new RolesController();
