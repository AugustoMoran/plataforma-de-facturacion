import { NextFunction, Request, Response } from 'express';
import { productsService } from './products.service';

export class ProductsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, categoryId, isActive } = req.query as Record<string, string>;
      const result = await productsService.getAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        categoryId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.getById(req.params['id']!);
      res.status(200).json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async getByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.getByBarcode(req.params['barcode']!);
      res.status(200).json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.create(
        req.body,
        req.user!.userId,
        req.file?.buffer,
        req.file?.mimetype,
      );
      res.status(201).json({ success: true, data: product, message: 'Product created' });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.update(
        req.params['id']!,
        req.body,
        req.file?.buffer,
        req.file?.mimetype,
      );
      res.status(200).json({ success: true, data: product, message: 'Product updated' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.softDelete(req.params['id']!);
      res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) { next(err); }
  }

  async calculatePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cost, ivaPercentage, profitPercentage, publicPrice } = req.body as {
        cost: number;
        ivaPercentage: number;
        profitPercentage?: number;
        publicPrice?: number;
      };

      let result: Record<string, number> = {};
      if (profitPercentage !== undefined) {
        result['publicPrice'] = productsService.calculatePublicPrice(cost, ivaPercentage, profitPercentage);
        result['profitPercentage'] = profitPercentage;
      } else if (publicPrice !== undefined) {
        result['profitPercentage'] = productsService.calculateProfitPercentage(cost, ivaPercentage, publicPrice);
        result['publicPrice'] = publicPrice;
      }
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const productsController = new ProductsController();
