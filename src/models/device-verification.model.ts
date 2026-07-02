import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceVerification extends Document {
  interviewId: mongoose.Types.ObjectId;
  cameraPermission: boolean;
  microphonePermission: boolean;
  browser: string;
  operatingSystem: string;
  internetStatus: boolean;
  cameraAvailable: boolean;
  microphoneAvailable: boolean;
  screenResolution: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const deviceVerificationSchema = new Schema<IDeviceVerification>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
      index: true,
    },
    cameraPermission: {
      type: Boolean,
      required: [true, 'Camera permission status is required'],
    },
    microphonePermission: {
      type: Boolean,
      required: [true, 'Microphone permission status is required'],
    },
    browser: {
      type: String,
      required: [true, 'Browser information is required'],
      trim: true,
    },
    operatingSystem: {
      type: String,
      required: [true, 'Operating system information is required'],
      trim: true,
    },
    internetStatus: {
      type: Boolean,
      required: [true, 'Internet status is required'],
    },
    cameraAvailable: {
      type: Boolean,
      required: [true, 'Camera availability is required'],
    },
    microphoneAvailable: {
      type: Boolean,
      required: [true, 'Microphone availability is required'],
    },
    screenResolution: {
      type: String,
      required: [true, 'Screen resolution is required'],
      trim: true,
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const DeviceVerification = mongoose.model<IDeviceVerification>(
  'DeviceVerification',
  deviceVerificationSchema,
);
