import mongoose, { Document, Schema } from 'mongoose';

export interface IStock extends Document {
  productId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  quantity: number;
  updatedAt: Date;
}

const StockSchema = new Schema<IStock>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

StockSchema.index({ productId: 1, branchId: 1 }, { unique: true });
StockSchema.index({ branchId: 1 });
StockSchema.index({ productId: 1 });

export const Stock = mongoose.model<IStock>('Stock', StockSchema);
