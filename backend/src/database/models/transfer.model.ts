import mongoose, { Document, Schema } from 'mongoose';

export interface ITransferItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
}

export type TransferStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface ITransfer extends Document {
  fromBranchId: mongoose.Types.ObjectId;
  toBranchId: mongoose.Types.ObjectId;
  items: ITransferItem[];
  status: TransferStatus;
  requestedBy: mongoose.Types.ObjectId;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferItemSchema = new Schema<ITransferItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const TransferSchema = new Schema<ITransfer>(
  {
    fromBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    toBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    items: { type: [TransferItemSchema], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

TransferSchema.index({ fromBranchId: 1, status: 1 });
TransferSchema.index({ toBranchId: 1, status: 1 });

export const Transfer = mongoose.model<ITransfer>('Transfer', TransferSchema);
