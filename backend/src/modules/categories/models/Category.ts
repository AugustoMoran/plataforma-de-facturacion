import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId;
  visibleInEcommerce: boolean;
  isActive: boolean;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    visibleInEcommerce: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1, parent: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
