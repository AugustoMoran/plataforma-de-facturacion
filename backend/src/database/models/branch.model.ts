import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isDeleted: boolean;
  managerUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false },
);

BranchSchema.index({ name: 1 });
BranchSchema.index({ isActive: 1, isDeleted: 1 });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
