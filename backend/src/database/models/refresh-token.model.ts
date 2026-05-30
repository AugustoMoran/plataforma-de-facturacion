import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  family: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    family: { type: String, required: true, index: true },
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, versionKey: false },
);

RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ family: 1, isRevoked: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
