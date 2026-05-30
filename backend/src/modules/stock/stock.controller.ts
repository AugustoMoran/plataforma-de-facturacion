import { NextFunction, Request, Response } from 'express';
import { stockService } from './stock.service';

export class StockController {
  async getByBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.params as { branchId: string };
      const { page, limit, search } = req.query as Record<string, string>;
      const result = await stockService.getByBranch(branchId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getProductStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params as { productId: string };
      const { branchId } = req.query as { branchId?: string };
      const data = await stockService.getProductStock(productId, branchId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await stockService.adjustStock(req.body, req.user!.userId);
      res.status(200).json({ success: true, data: result, message: 'Stock adjusted' });
    } catch (err) { next(err); }
  }

  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, branchId, type, page, limit, dateFrom, dateTo } = req.query as Record<string, string>;
      const result = await stockService.getMovements({
        productId,
        branchId,
        type: type as any,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        dateFrom,
        dateTo,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await stockService.transferStock(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: transfer, message: 'Transfer completed' });
    } catch (err) { next(err); }
  }
}

export const stockController = new StockController();
