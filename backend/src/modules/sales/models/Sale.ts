import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
  ivaRate: number;
  subtotal: number;
}

export interface ISale extends Document {
  items: ISaleItem[];
  totalNeto: number;
  totalIva: number;
  total: number;
  discountType?: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountAmount?: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'payway';
  source: 'POS' | 'ECOMMERCE';
  invoiceType: 'A' | 'B' | 'C' | 'Ticket' | 'NONE';
  invoiceNumber: string;
  remitoNumber?: string;
  clientName?: string;
  clientCuit?: string;
  clientAddress?: string;
  clientFiscalCondition?: string;
  cae?: string;
  caeExpiration?: Date;
  voucherNumber?: number;
  billingStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NONE' | 'NOT_INVOICED';
  errorMessage?: string;
  seller: mongoose.Types.ObjectId;
  branch: mongoose.Types.ObjectId;
  sellerCommissionRate: number;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  shippingAddress?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  shippingMethod?: string;
  shippingCost?: number;
  customerEmail?: string;
  customerPhone?: string;
  shippingModalidad?: 'D' | 'S';
  shippingQuote?: {
    optionId?: string;
    provinceId?: string;
    modalidad?: 'D' | 'S';
    carrierId?: string;
    carrierName?: string;
    service?: string;
    despacho?: string;
    customerCost?: number;
    sellerCost?: number;
    estimatedHours?: number;
    paquetes?: string;
    weight?: number;
    sucursal?: {
      id?: number;
      nombre?: string;
      calle?: string;
      numero?: string;
      localidad?: string;
      codigoPostal?: string;
      horario?: string;
      correo?: string;
    };
  };
  envioPackPedidoId?: number;
  envioPackEnvioId?: number;
  envioPackSellerCost?: number;
  shippingStatus?: 'pending_payment' | 'awaiting_dispatch' | 'label_ready' | 'shipped' | 'delivered';
  trackingNumber?: string;
  paymentId?: string;
  paymentStatus?: string;
  createdAt: Date;
}

const SaleSchema: Schema = new Schema({
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    ivaRate: { type: Number, required: true, default: 21 },
    subtotal: { type: Number, required: true },
  }],
  totalNeto: { type: Number, required: true },
  totalIva: { type: Number, required: true },
  total: { type: Number, required: true },
  discountType: {
    type: String,
    enum: ['NONE', 'PERCENTAGE', 'FIXED'],
    default: 'NONE',
  },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'mercadopago', 'payway'],
    default: 'efectivo',
  },
  source: {
    type: String,
    enum: ['POS', 'ECOMMERCE'],
    default: 'POS',
  },
  invoiceType: {
    type: String,
    enum: ['A', 'B', 'C', 'Ticket', 'NONE'],
    default: 'NONE',
  },
  invoiceNumber: { type: String },
  remitoNumber: { type: String },
  clientName: { type: String },
  clientCuit: { type: String },
  clientAddress: { type: String },
  clientFiscalCondition: { type: String },
  cae: { type: String },
  caeExpiration: { type: Date },
  voucherNumber: { type: Number },
  billingStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'NONE', 'NOT_INVOICED'],
    default: 'NONE',
  },
  errorMessage: { type: String },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  sellerCommissionRate: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['COMPLETED', 'CANCELLED', 'REFUNDED'],
    default: 'COMPLETED',
  },
  shippingAddress: {
    street: { type: String },
    city: { type: String },
    province: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  shippingMethod: { type: String },
  shippingCost: { type: Number, default: 0 },
  customerEmail: { type: String },
  customerPhone: { type: String },
  shippingModalidad: { type: String, enum: ['D', 'S'] },
  shippingQuote: {
    optionId: { type: String },
    provinceId: { type: String },
    modalidad: { type: String, enum: ['D', 'S'] },
    carrierId: { type: String },
    carrierName: { type: String },
    service: { type: String },
    despacho: { type: String },
    customerCost: { type: Number },
    sellerCost: { type: Number },
    estimatedHours: { type: Number },
    paquetes: { type: String },
    weight: { type: Number },
    sucursal: {
      id: { type: Number },
      nombre: { type: String },
      calle: { type: String },
      numero: { type: String },
      localidad: { type: String },
      codigoPostal: { type: String },
      horario: { type: String },
      correo: { type: String },
    },
  },
  envioPackPedidoId: { type: Number },
  envioPackEnvioId: { type: Number },
  envioPackSellerCost: { type: Number },
  shippingStatus: {
    type: String,
    enum: ['pending_payment', 'awaiting_dispatch', 'label_ready', 'shipped', 'delivered'],
    default: 'pending_payment',
  },
  trackingNumber: { type: String },
  paymentId: { type: String },
  paymentStatus: { type: String },
}, {
  timestamps: true,
  versionKey: false,
});

SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model<ISale>('Sale', SaleSchema);
