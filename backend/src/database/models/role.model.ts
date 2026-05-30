import mongoose, { Document, Schema } from 'mongoose';

import type { PermissionsMap, UserRole } from '../../shared/types';

export interface IPermission extends Document {
  name: string;
  description: string;
  key: keyof PermissionsMap;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRole extends Document {
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Partial<PermissionsMap>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    permissions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

RoleSchema.index({ isActive: 1 });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
