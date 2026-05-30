import mongoose, { Document, Schema } from 'mongoose';

import type { AfipStatus, AfipVoucherType, SaleStatus, SaleType } from '../../shared/types';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  barcode?: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  ivaPercentage: number;
  ivaAmount: number;
  subtotal: number;
  profitAmount: number;
}

export interface IAfipData {
  voucherType: AfipVoucherType;
  voucherNumber?: number;
  cae?: string;
  caeDueDate?: string;
  status: AfipStatus;
  processedAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

export interface ISale extends Document {
  branchId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  sellerCommissionPercentage: number;
  items: ISaleItem[];
  saleType: SaleType;
  status: SaleStatus;
  subtotal: number;
  totalIva: number;
  totalCost: number;
  totalProfit: number;
  commissionAmount: number;
  total: number;
  customerName?: string;
  customerCuit?: string;
  notes?: string;
  afip?: IAfipData;
  pdfUrl?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  parentSaleId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    barcode: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    ivaPercentage: { type: Number, required: true },
    ivaAmount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    profitAmount: { type: Number, required: true },
  },
  { _id: false },
);

const AfipDataSchema = new Schema<IAfipData>(
  {
    voucherType: {
      type: String,
      enum: ['FACTURA_A', 'FACTURA_B', 'TICKET', 'NOTA_CREDITO_A', 'NOTA_CREDITO_B'],
      required: true,
    },
    voucherNumber: { type: Number },
    cae: { type: String },
    caeDueDate: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'ERROR'],
      default: 'PENDING',
    },
    processedAt: { type: Date },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const SaleSchema = new Schema<ISale>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerName: { type: String, required: true },
    sellerCommissionPercentage: { type: Number, required: true, default: 0 },
    items: { type: [SaleItemSchema], required: true },
    saleType: { type: String, enum: ['FACTURADA', 'NO_FACTURADA'], required: true },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'completed',
    },
    subtotal: { type: Number, required: true },
    totalIva: { type: Number, required: true, default: 0 },
    totalCost: { type: Number, required: true },
    totalProfit: { type: Number, required: true },
    commissionAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    customerName: { type: String, default: null },
    customerCuit: { type: String, default: null },
    notes: { type: String, default: '' },
    afip: { type: AfipDataSchema, default: null },
    pdfUrl: { type: String, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    parentSaleId: { type: Schema.Types.ObjectId, ref: 'Sale', default: null },
  },
  { timestamps: true, versionKey: false },
);

SaleSchema.index({ branchId: 1, createdAt: -1 });
SaleSchema.index({ sellerId: 1, createdAt: -1 });
SaleSchema.index({ status: 1, createdAt: -1 });
SaleSchema.index({ saleType: 1, createdAt: -1 });
SaleSchema.index({ 'afip.status': 1 });

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
