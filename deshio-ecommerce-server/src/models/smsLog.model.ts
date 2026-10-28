import { Schema, Types, model } from 'mongoose';

export interface ISmsLog {
  _id?: Types.ObjectId;
  to: string;
  message: string;
  event: string;
  status: 'sent' | 'failed' | 'dry_run';
  providerCode?: number;
  providerMessage?: string;
  orderId?: Types.ObjectId;
  userId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const smsLogSchema = new Schema<ISmsLog>(
  {
    to: { type: String, required: true, trim: true, index: true },
    message: { type: String, required: true },
    event: { type: String, required: true, default: 'manual', index: true },
    status: {
      type: String,
      enum: ['sent', 'failed', 'dry_run'],
      required: true,
      index: true,
    },
    providerCode: { type: Number },
    providerMessage: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const SmsLog = model<ISmsLog>('SmsLog', smsLogSchema);
export default SmsLog;
