import { Schema, model, Document } from 'mongoose';

export interface IUserShippingAddress {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  roles: string[];
  permissions: Record<string, boolean>;
  commissionRate: number; // Porcentaje de comisión
  branch: Schema.Types.ObjectId; // Sucursal asignada
  phone?: string;
  defaultShippingAddress?: IUserShippingAddress;
  emailVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  marketingOptIn?: boolean;
  refreshTokens: { token: string; createdAt: Date }[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    roles: { type: [String], default: ['vendedor'] },
    permissions: { type: Schema.Types.Mixed, default: {} },
    commissionRate: { type: Number, default: 0 },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    phone: { type: String },
    defaultShippingAddress: {
      street: { type: String },
      city: { type: String },
      province: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'AR' },
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String },
    emailVerificationExpiresAt: { type: Date },
    marketingOptIn: { type: Boolean, default: false },
    refreshTokens: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
