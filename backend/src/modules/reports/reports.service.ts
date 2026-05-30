import { Sale } from '../../database/models/sale.model';
import { Stock } from '../../database/models/stock.model';
import { StockMovement } from '../../database/models/stock-movement.model';

export class ReportsService {
  async getDailySales(query: {
    branchId?: string;
    sellerId?: string;
    dateFrom: string;
    dateTo: string;
  }) {
    const filter: Record<string, unknown> = {
      status: 'completed',
      createdAt: {
        $gte: new Date(query.dateFrom),
        $lte: new Date(query.dateTo),
      },
    };
    if (query.branchId) filter['branchId'] = query.branchId;
    if (query.sellerId) filter['sellerId'] = query.sellerId;

    const [totals, byDay, byType] = await Promise.all([
      Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalCost: { $sum: '$totalCost' },
            totalProfit: { $sum: '$totalProfit' },
            totalIva: { $sum: '$totalIva' },
            totalCommissions: { $sum: '$commissionAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            totalRevenue: { $sum: '$total' },
            totalProfit: { $sum: '$totalProfit' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$saleType',
            count: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
      ]),
    ]);

    return {
      totals: totals[0] ?? {
        totalRevenue: 0, totalCost: 0, totalProfit: 0,
        totalIva: 0, totalCommissions: 0, count: 0,
      },
      byDay,
      byType,
    };
  }

  async getSellerReport(query: {
    branchId?: string;
    dateFrom: string;
    dateTo: string;
  }) {
    const filter: Record<string, unknown> = {
      status: 'completed',
      createdAt: {
        $gte: new Date(query.dateFrom),
        $lte: new Date(query.dateTo),
      },
    };
    if (query.branchId) filter['branchId'] = query.branchId;

    return Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$sellerId',
          sellerName: { $first: '$sellerName' },
          totalRevenue: { $sum: '$total' },
          totalProfit: { $sum: '$totalProfit' },
          totalCommission: { $sum: '$commissionAmount' },
          saleCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  }

  async getProductsReport(query: {
    branchId?: string;
    dateFrom: string;
    dateTo: string;
  }) {
    const filter: Record<string, unknown> = {
      status: 'completed',
      createdAt: {
        $gte: new Date(query.dateFrom),
        $lte: new Date(query.dateTo),
      },
    };
    if (query.branchId) filter['branchId'] = query.branchId;

    return Sale.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalProfit: { $sum: '$items.profitAmount' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 50 },
    ]);
  }

  async getStockReport(branchId?: string) {
    const filter: Record<string, unknown> = {};
    if (branchId) filter['branchId'] = branchId;

    return Stock.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $match: { 'product.isDeleted': false },
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branchId',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: '$branch' },
      {
        $project: {
          productId: 1,
          productName: '$product.name',
          branchId: 1,
          branchName: '$branch.name',
          quantity: 1,
          minStock: '$product.minStock',
          isLow: { $lte: ['$quantity', '$product.minStock'] },
        },
      },
      { $sort: { branchName: 1, productName: 1 } },
    ]);
  }
}

export const reportsService = new ReportsService();
