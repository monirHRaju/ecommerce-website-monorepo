import { Schema, Types, model } from 'mongoose';

export interface ITrackingLog {
  _id?: Types.ObjectId;
  eventName: string;
  eventId: string;
  source: 'browser' | 'server_order' | 'test';
  platform: 'meta_capi';
  status: 'sent' | 'failed' | 'dry_run';
  pixelId?: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  orderId?: Types.ObjectId;
  orderNumber?: string;
  userId?: Types.ObjectId;
  responseCode?: number;
  responseMessage?: string;
  eventsReceived?: number;
  fbtraceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const trackingLogSchema = new Schema<ITrackingLog>(
  {
    eventName: { type: String, required: true, trim: true, index: true },
    eventId: { type: String, required: true, trim: true, index: true },
    source: {
      type: String,
      enum: ['browser', 'server_order', 'test'],
      default: 'browser',
      index: true,
    },
    platform: {
      type: String,
      enum: ['meta_capi'],
      default: 'meta_capi',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'dry_run'],
      required: true,
      index: true,
    },
    pixelId: { type: String, trim: true },
    eventSourceUrl: { type: String, trim: true },
    value: { type: Number },
    currency: { type: String, default: 'BDT' },
    contentIds: { type: [String], default: [] },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    responseCode: { type: Number },
    responseMessage: { type: String },
    eventsReceived: { type: Number },
    fbtraceId: { type: String },
  },
  { timestamps: true }
);

const TrackingLog = model<ITrackingLog>('TrackingLog', trackingLogSchema);
export default TrackingLog;
