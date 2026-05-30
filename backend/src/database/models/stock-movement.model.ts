import mongoose, { Document, Schema } from 'mongoose';

import type { StockMovementType } from '../../shared/types';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: 'Sale' | 'Transfer';
  performedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    type: {
      type: String,
      enum: ['SALE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'MANUAL_ADJUSTMENT', 'INITIAL'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String, default: '' },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    referenceModel: { type: String, enum: ['Sale', 'Transfer'], default: null },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

StockMovementSchema.index({ productId: 1, branchId: 1, createdAt: -1 });
StockMovementSchema.index({ type: 1, createdAt: -1 });
StockMovementSchema.index({ referenceId: 1, referenceModel: 1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
