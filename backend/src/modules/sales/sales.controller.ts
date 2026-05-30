import { NextFunction, Request, Response } from 'express';
import { salesService } from './sales.service';

export class SalesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, branchId, sellerId, status, saleType, dateFrom, dateTo } = req.query as Record<string, string>;
      const result = await salesService.getAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        branchId,
        sellerId,
        status: status as any,
        saleType: saleType as any,
        dateFrom,
        dateTo,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await salesService.getById(req.params['id']!);
      res.status(200).json({ success: true, data: sale });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await salesService.create(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: sale, message: 'Sale created successfully' });
    } catch (err) { next(err); }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body as { reason: string };
      const sale = await salesService.cancel(req.params['id']!, reason, req.user!.userId);
      res.status(200).json({ success: true, data: sale, message: 'Sale cancelled' });
    } catch (err) { next(err); }
  }
}

export const salesController = new SalesController();
