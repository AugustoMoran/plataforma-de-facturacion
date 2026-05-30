import { NextFunction, Request, Response } from 'express';
import { branchesService } from './branches.service';

export class BranchesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query as Record<string, string>;
      const result = await branchesService.getAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchesService.getById(req.params['id']!);
      res.status(200).json({ success: true, data: branch });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchesService.create(req.body);
      res.status(201).json({ success: true, data: branch, message: 'Branch created' });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchesService.update(req.params['id']!, req.body);
      res.status(200).json({ success: true, data: branch, message: 'Branch updated' });
    } catch (err) { next(err); }
  }

  async getVendedores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await branchesService.getVendedores(req.params['id']!);
      res.status(200).json({ success: true, data: users });
    } catch (err) { next(err); }
  }

  async assignVendedor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await branchesService.assignVendedor(req.params['id']!, req.body.userId);
      res.status(200).json({ success: true, message: 'Vendor assigned to branch' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await branchesService.softDelete(req.params['id']!);
      res.status(200).json({ success: true, message: 'Branch deleted' });
    } catch (err) { next(err); }
  }
}

export const branchesController = new BranchesController();
