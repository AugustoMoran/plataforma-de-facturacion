import bcrypt from 'bcrypt';
import mongoose, { Document, Schema } from 'mongoose';

import type { PermissionsMap } from '../../shared/types';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  permissions: Partial<PermissionsMap>;
  commissionPercentage: number;
  isActive: boolean;
  isDeleted: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  get fullName(): string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    permissions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    commissionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods['comparePassword'] = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ email: 1, isDeleted: 1 });
UserSchema.index({ roleId: 1 });
UserSchema.index({ branchId: 1 });
UserSchema.index({ isActive: 1, isDeleted: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
