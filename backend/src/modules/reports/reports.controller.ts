import { NextFunction, Request, Response } from 'express';
import { reportsService } from './reports.service';

export class ReportsController {
  async getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, sellerId, dateFrom, dateTo } = req.query as Record<string, string>;
      if (!dateFrom || !dateTo) {
        res.status(400).json({ success: false, message: 'dateFrom and dateTo are required' });
        return;
      }
      const data = await reportsService.getDailySales({ branchId, sellerId, dateFrom, dateTo });
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, dateFrom, dateTo } = req.query as Record<string, string>;
      if (!dateFrom || !dateTo) {
        res.status(400).json({ success: false, message: 'dateFrom and dateTo are required' });
        return;
      }
      const data = await reportsService.getSellerReport({ branchId, dateFrom, dateTo });
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, dateFrom, dateTo } = req.query as Record<string, string>;
      if (!dateFrom || !dateTo) {
        res.status(400).json({ success: false, message: 'dateFrom and dateTo are required' });
        return;
      }
      const data = await reportsService.getProductsReport({ branchId, dateFrom, dateTo });
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.query as Record<string, string>;
      const data = await reportsService.getStockReport(branchId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}

export const reportsController = new ReportsController();
