import { NextFunction, Request, Response } from 'express';

import { usersService } from './users.service';

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, roleId, branchId, isActive } = req.query as Record<string, string>;
      const result = await usersService.getAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        roleId,
        branchId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getById(req.params['id']!);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.create(req.body);
      res.status(201).json({ success: true, data: user, message: 'User created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.update(req.params['id']!, req.body);
      res.status(200).json({ success: true, data: user, message: 'User updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.updatePassword(req.params['id']!, req.body.password);
      res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.softDelete(req.params['id']!);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
