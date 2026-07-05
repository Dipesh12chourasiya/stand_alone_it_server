import mongoose, { Schema, type Document } from 'mongoose';

// ─── Document Interface ─────────────────────────────────────────

export interface IReport extends Document {
  interviewId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;

  // Embedded interview info (snapshotted at report generation time)
  interview: {
    title: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    meetingPlatform: string;
    meetingLink: string;
    date: Date;
    time: string;
    duration: number;
    status: string;
  };

  // Embedded recruiter info (snapshotted)
  recruiter?: {
    name: string;
    email: string;
    company: string;
  };

  // Computed duration in minutes
  duration: number;

  // Interview status at the time of report generation
  status: string;

  // Summary-level timeline (lightweight — full timeline is queried separately)
  timelineSummary?: Array<{
    eventType: string;
    severity: string;
    message: string;
    createdAt: Date;
  }>;

  // Connection history
  connectionHistory?: Array<{
    role: string;
    connectedAt: Date;
    disconnectedAt?: Date;
    duration?: number;
  }>;

  // Device verification snapshot
  deviceVerification?: {
    overall: 'pass' | 'fail';
    checks: Array<{ name: string; status: 'pass' | 'fail' }>;
    browser?: string;
    operatingSystem?: string;
    screenResolution?: string;
    submittedAt?: Date;
  };

  // Flexible metadata for future extensions (AI results, browser monitoring, etc.)
  metadata: Record<string, unknown>;

  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────

const reportSchema = new Schema<IReport>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      // Unique index is defined via schema.index() below — no field-level index
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true,
      // Compound indexes including recruiterId are defined via schema.index() below
    },
    interview: {
      title: { type: String, required: true },
      candidateName: { type: String, required: true },
      candidateEmail: { type: String, required: true },
      candidatePhone: { type: String, default: '' },
      meetingPlatform: { type: String, required: true },
      meetingLink: { type: String, required: true },
      date: { type: Date, required: true },
      time: { type: String, required: true },
      duration: { type: Number, required: true },
      status: { type: String, required: true },
    },
    recruiter: {
      name: { type: String },
      email: { type: String },
      company: { type: String },
    },
    duration: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: true,
    },
    timelineSummary: [
      {
        eventType: { type: String },
        severity: { type: String },
        message: { type: String },
        createdAt: { type: Date },
      },
    ],
    connectionHistory: [
      {
        role: { type: String },
        connectedAt: { type: Date },
        disconnectedAt: { type: Date, default: null },
        duration: { type: Number, default: 0 },
      },
    ],
    deviceVerification: {
      overall: { type: String, enum: ['pass', 'fail'] },
      checks: [
        {
          name: { type: String },
          status: { type: String, enum: ['pass', 'fail'] },
        },
      ],
      browser: { type: String },
      operatingSystem: { type: String },
      screenResolution: { type: String },
      submittedAt: { type: Date },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      default: '',
      maxlength: [5000, 'Notes must not exceed 5000 characters'],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ────────────────────────────────────────────────────

reportSchema.index({ recruiterId: 1, createdAt: -1 });
reportSchema.index({ recruiterId: 1, status: 1 });
reportSchema.index({ interviewId: 1 }, { unique: true });

// ─── Model ──────────────────────────────────────────────────────

export const Report = mongoose.model<IReport>('Report', reportSchema);
