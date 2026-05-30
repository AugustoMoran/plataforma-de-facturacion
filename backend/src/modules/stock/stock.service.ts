import mongoose from 'mongoose';

import { Product } from '../../database/models/product.model';
import { Stock } from '../../database/models/stock.model';
import { StockMovement } from '../../database/models/stock-movement.model';
import { Notification } from '../../database/models/notification.model';
import type { StockMovementType } from '../../shared/types';
import { SOCKET_EVENTS } from '../../shared/types';
import { AppError } from '../../middleware/error.middleware';
import { getSocketServer } from '../../sockets/socket.server';

export class StockService {
  async getByBranch(branchId: string, query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const productFilter: Record<string, unknown> = { isDeleted: false };
    if (query.search) {
      productFilter['$or'] = [
        { name: { $regex: query.search, $options: 'i' } },
        { barcode: query.search },
        { internalCode: { $regex: query.search, $options: 'i' } },
      ];
    }

    const products = await Product.find(productFilter).select('_id').lean();
    const productIds = products.map((p) => p._id);

    const stockFilter: Record<string, unknown> = { branchId, productId: { $in: productIds } };

    const [stocks, total] = await Promise.all([
      Stock.find(stockFilter)
        .populate({
          path: 'productId',
          select: 'name barcode internalCode minStock categoryId image publicPrice',
          populate: { path: 'categoryId', select: 'name' },
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Stock.countDocuments(stockFilter),
    ]);

    return {
      data: stocks,
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

  async getProductStock(productId: string, branchId?: string) {
    const filter: Record<string, unknown> = { productId };
    if (branchId) filter['branchId'] = branchId;
    return Stock.find(filter).populate('branchId', 'name').lean();
  }

  async adjustStock(
    data: {
      productId: string;
      branchId: string;
      quantity: number;
      type: StockMovementType;
      reason?: string;
      referenceId?: string;
      referenceModel?: 'Sale' | 'Transfer';
    },
    performedBy: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let stock = await Stock.findOne({ productId: data.productId, branchId: data.branchId }).session(session);

      if (!stock) {
        stock = await Stock.create([{ productId: data.productId, branchId: data.branchId, quantity: 0 }], {
          session,
        }).then((docs) => docs[0]);
      }

      const previousQuantity = stock!.quantity;
      const newQuantity = previousQuantity + data.quantity;

      if (newQuantity < 0) {
        throw new AppError(`Insufficient stock. Available: ${previousQuantity}`, 400);
      }

      stock!.quantity = newQuantity;
      await stock!.save({ session });

      await StockMovement.create(
        [
          {
            productId: data.productId,
            branchId: data.branchId,
            type: data.type,
            quantity: data.quantity,
            previousQuantity,
            newQuantity,
            reason: data.reason,
            referenceId: data.referenceId,
            referenceModel: data.referenceModel,
            performedBy,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      // Emit real-time stock update
      const io = getSocketServer();
      if (io) {
        io.to(`branch:${data.branchId}`).emit(SOCKET_EVENTS.STOCK_UPDATED, {
          productId: data.productId,
          branchId: data.branchId,
          quantity: newQuantity,
          type: data.type,
        });

        // Check min stock alert
        const product = await Product.findById(data.productId).lean();
        if (product && newQuantity <= product.minStock) {
          io.emit(SOCKET_EVENTS.STOCK_ALERT, {
            productId: data.productId,
            productName: product.name,
            branchId: data.branchId,
            quantity: newQuantity,
            minStock: product.minStock,
          });

          await Notification.create({
            branchId: data.branchId,
            type: 'STOCK_ALERT',
            severity: newQuantity === 0 ? 'error' : 'warning',
            title: 'Alerta de stock',
            message: `${product.name} tiene stock bajo: ${newQuantity} unidades`,
            metadata: { productId: data.productId, quantity: newQuantity, minStock: product.minStock },
          });
        }
      }

      return stock;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getMovements(
    query: {
      productId?: string;
      branchId?: string;
      type?: StockMovementType;
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.productId) filter['productId'] = query.productId;
    if (query.branchId) filter['branchId'] = query.branchId;
    if (query.type) filter['type'] = query.type;
    if (query.dateFrom || query.dateTo) {
      filter['createdAt'] = {};
      if (query.dateFrom) (filter['createdAt'] as any)['$gte'] = new Date(query.dateFrom);
      if (query.dateTo) (filter['createdAt'] as any)['$lte'] = new Date(query.dateTo);
    }

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('productId', 'name barcode')
        .populate('branchId', 'name')
        .populate('performedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    return {
      data: movements,
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

  async transferStock(
    data: {
      fromBranchId: string;
      toBranchId: string;
      items: Array<{ productId: string; quantity: number }>;
      notes?: string;
    },
    requestedBy: string,
  ) {
    const { Transfer } = await import('../../database/models/transfer.model');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create transfer record
      const products = await Product.find({
        _id: { $in: data.items.map((i) => i.productId) },
      }).lean();
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const transfer = await Transfer.create(
        [
          {
            fromBranchId: data.fromBranchId,
            toBranchId: data.toBranchId,
            items: data.items.map((i) => ({
              productId: i.productId,
              productName: productMap.get(i.productId)?.name ?? '',
              quantity: i.quantity,
            })),
            status: 'PENDING',
            requestedBy,
            notes: data.notes,
          },
        ],
        { session },
      );

      // Deduct from source, add to destination
      for (const item of data.items) {
        await this.adjustStock(
          {
            productId: item.productId,
            branchId: data.fromBranchId,
            quantity: -item.quantity,
            type: 'TRANSFER_OUT',
            reason: `Transfer to branch`,
            referenceId: transfer[0]._id.toString(),
            referenceModel: 'Transfer',
          },
          requestedBy,
        );

        await this.adjustStock(
          {
            productId: item.productId,
            branchId: data.toBranchId,
            quantity: item.quantity,
            type: 'TRANSFER_IN',
            reason: `Transfer from branch`,
            referenceId: transfer[0]._id.toString(),
            referenceModel: 'Transfer',
          },
          requestedBy,
        );
      }

      await Transfer.updateOne({ _id: transfer[0]._id }, { status: 'COMPLETED', completedBy: requestedBy, completedAt: new Date() }, { session });

      await session.commitTransaction();

      const io = getSocketServer();
      if (io) {
        io.emit(SOCKET_EVENTS.TRANSFER_COMPLETED, {
          transferId: transfer[0]._id,
          fromBranchId: data.fromBranchId,
          toBranchId: data.toBranchId,
        });
      }

      return transfer[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export const stockService = new StockService();
