import mongoose from 'mongoose';

import { Product } from '../../database/models/product.model';
import { Sale, ISaleItem } from '../../database/models/sale.model';
import { User } from '../../database/models/user.model';
import type { SaleType, SaleStatus } from '../../shared/types';
import { SOCKET_EVENTS } from '../../shared/types';
import { AppError } from '../../middleware/error.middleware';
import { stockService } from '../stock/stock.service';
import { getSocketServer } from '../../sockets/socket.server';
import { afipQueue } from '../../queues/afip.queue';
import { validateObjectId } from '../../shared/utils/validation';

export interface CreateSaleDto {
  branchId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  saleType: SaleType;
  customerName?: string;
  customerCuit?: string;
  notes?: string;
  afipVoucherType?: string;
}

export class SalesService {
  async create(dto: CreateSaleDto, sellerId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const seller = await User.findById(sellerId).lean();
      if (!seller) throw new AppError('Seller not found', 404);

      // Resolve products and calculate totals
      const productIds = dto.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, isDeleted: false }).lean();
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const saleItems: ISaleItem[] = [];
      let subtotal = 0;
      let totalIva = 0;
      let totalCost = 0;

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

        const unitPrice = product.publicPrice;
        let unitIva = 0;
        let unitSubtotal = unitPrice * item.quantity;

        if (dto.saleType === 'FACTURADA') {
          // IVA is included in publicPrice (precio con IVA)
          unitIva = (product.cost * (product.ivaPercentage / 100)) * item.quantity;
          totalIva += unitIva;
        }
        // For NO_FACTURADA: IVA becomes profit (no AFIP impact)

        const unitCost = product.cost;
        const profitAmount = (unitPrice - unitCost * (1 + product.ivaPercentage / 100)) * item.quantity;

        saleItems.push({
          productId: product._id as mongoose.Types.ObjectId,
          name: product.name,
          barcode: product.barcode ?? undefined,
          quantity: item.quantity,
          unitCost,
          unitPrice,
          ivaPercentage: dto.saleType === 'FACTURADA' ? product.ivaPercentage : 0,
          ivaAmount: dto.saleType === 'FACTURADA' ? unitIva : 0,
          subtotal: unitSubtotal,
          profitAmount,
        });

        subtotal += unitSubtotal;
        totalCost += unitCost * item.quantity;
      }

      const totalProfit = subtotal - totalCost;
      const total = subtotal;
      const commissionAmount = (total * seller.commissionPercentage) / 100;

      const [sale] = await Sale.create(
        [
          {
            branchId: dto.branchId,
            sellerId,
            sellerName: `${seller.firstName} ${seller.lastName}`,
            sellerCommissionPercentage: seller.commissionPercentage,
            items: saleItems,
            saleType: dto.saleType,
            status: 'completed',
            subtotal,
            totalIva,
            totalCost,
            totalProfit,
            commissionAmount,
            total,
            customerName: dto.customerName,
            customerCuit: dto.customerCuit,
            notes: dto.notes,
            afip:
              dto.saleType === 'FACTURADA'
                ? {
                    voucherType: dto.afipVoucherType ?? 'FACTURA_B',
                    status: 'PENDING',
                    retryCount: 0,
                  }
                : null,
          },
        ],
        { session },
      );

      // Deduct stock
      for (const item of dto.items) {
        await stockService.adjustStock(
          {
            productId: item.productId,
            branchId: dto.branchId,
            quantity: -item.quantity,
            type: 'SALE',
            referenceId: sale._id.toString(),
            referenceModel: 'Sale',
          },
          sellerId,
        );
      }

      await session.commitTransaction();

      // Enqueue AFIP job if facturada
      if (dto.saleType === 'FACTURADA') {
        await afipQueue.add('process-afip', { saleId: sale._id.toString() }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
      }

      const io = getSocketServer();
      if (io) {
        io.to(`branch:${dto.branchId}`).emit(SOCKET_EVENTS.SALE_CREATED, {
          saleId: sale._id,
          branchId: dto.branchId,
          total: sale.total,
          saleType: dto.saleType,
        });
      }

      return Sale.findById(sale._id).lean();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getAll(query: {
    page?: number;
    limit?: number;
    branchId?: string;
    sellerId?: string;
    status?: SaleStatus;
    saleType?: SaleType;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.branchId) filter['branchId'] = validateObjectId(query.branchId, 'branchId');
    if (query.sellerId) filter['sellerId'] = validateObjectId(query.sellerId, 'sellerId');
    if (query.status) filter['status'] = query.status;
    if (query.saleType) filter['saleType'] = query.saleType;
    if (query.dateFrom || query.dateTo) {
      filter['createdAt'] = {};
      if (query.dateFrom) {
        const d = new Date(String(query.dateFrom));
        if (isNaN(d.getTime())) throw new AppError('Invalid dateFrom', 400);
        (filter['createdAt'] as any)['$gte'] = d;
      }
      if (query.dateTo) {
        const d = new Date(String(query.dateTo));
        if (isNaN(d.getTime())) throw new AppError('Invalid dateTo', 400);
        (filter['createdAt'] as any)['$lte'] = d;
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('branchId', 'name')
        .populate('sellerId', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Sale.countDocuments(filter),
    ]);

    return {
      data: sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string) {
    validateObjectId(id);
    const sale = await Sale.findById(id)
      .populate('branchId', 'name')
      .populate('sellerId', 'firstName lastName email')
      .populate('items.productId', 'name barcode')
      .lean();
    if (!sale) throw new AppError('Sale not found', 404);
    return sale;
  }

  async cancel(id: string, reason: string, cancelledBy: string) {
    validateObjectId(id);
    validateObjectId(cancelledBy, 'cancelledBy');
    const sale = await Sale.findById(id);
    if (!sale) throw new AppError('Sale not found', 404);
    if (sale.status !== 'completed') throw new AppError('Only completed sales can be cancelled', 400);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      sale.status = 'cancelled';
      sale.cancelledBy = new mongoose.Types.ObjectId(cancelledBy);
      sale.cancelledAt = new Date();
      sale.cancellationReason = reason;
      await sale.save({ session });

      // Restore stock
      for (const item of sale.items) {
        await stockService.adjustStock(
          {
            productId: item.productId.toString(),
            branchId: sale.branchId.toString(),
            quantity: item.quantity,
            type: 'RETURN',
            reason: `Cancellation of sale ${id}`,
            referenceId: id,
            referenceModel: 'Sale',
          },
          cancelledBy,
        );
      }

      await session.commitTransaction();

      const io = getSocketServer();
      if (io) {
        io.to(`branch:${sale.branchId}`).emit(SOCKET_EVENTS.SALE_CANCELLED, { saleId: id });
      }

      return sale;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export const salesService = new SalesService();
