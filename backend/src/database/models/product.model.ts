import mongoose, { Document, Schema } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  image?: IProductImage;
  categoryId: mongoose.Types.ObjectId;
  barcode?: string;
  internalCode?: string;
  cost: number;
  ivaPercentage: number;
  profitPercentage: number;
  publicPrice: number;
  minStock: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    image: { type: ProductImageSchema, default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    barcode: { type: String, sparse: true, index: true, default: null },
    internalCode: { type: String, sparse: true, index: true, default: null },
    cost: { type: Number, required: true, min: 0 },
    ivaPercentage: { type: Number, required: true, default: 21, min: 0 },
    profitPercentage: { type: Number, required: true, default: 0, min: 0 },
    publicPrice: { type: Number, required: true, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

ProductSchema.index({ name: 'text', barcode: 1, internalCode: 1 });
ProductSchema.index({ categoryId: 1, isActive: 1, isDeleted: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
