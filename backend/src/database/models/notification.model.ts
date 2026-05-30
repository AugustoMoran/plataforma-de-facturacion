import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'STOCK_ALERT' | 'TRANSFER' | 'SALE' | 'AFIP' | 'SYSTEM';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    type: {
      type: String,
      enum: ['STOCK_ALERT', 'TRANSFER', 'SALE', 'AFIP', 'SYSTEM'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ branchId: 1, createdAt: -1 });
// Auto-delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
