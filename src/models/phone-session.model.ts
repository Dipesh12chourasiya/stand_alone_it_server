import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoneSession extends Document {
  interviewId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  sessionToken: string;
  expiresAt: Date;
  status: 'Pending' | 'Connected' | 'Disconnected' | 'Expired';
  phoneConnectedAt?: Date;
  phoneDisconnectedAt?: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    camera?: string;
    batteryLevel?: number;
    internetType?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const PHONE_SESSION_STATUSES = [
  'Pending',
  'Connected',
  'Disconnected',
  'Expired',
] as const;

export type PhoneSessionStatus = (typeof PHONE_SESSION_STATUSES)[number];

const phoneSessionSchema = new Schema<IPhoneSession>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
      index: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: PHONE_SESSION_STATUSES,
        message:
          'Status must be one of: Pending, Connected, Disconnected, Expired',
      },
      default: 'Pending',
    },
    phoneConnectedAt: {
      type: Date,
      default: null,
    },
    phoneDisconnectedAt: {
      type: Date,
      default: null,
    },
    deviceInfo: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Auto-expire sessions: TTL index on expiresAt (MongoDB removes docs after expiry)
phoneSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneSession = mongoose.model<IPhoneSession>(
  'PhoneSession',
  phoneSessionSchema,
);
