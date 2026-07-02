import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// ─── Document Interface ─────────────────────────────────────

export interface IInterview extends Document {
  title: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  meetingPlatform: 'Google Meet' | 'Microsoft Teams' | 'Zoom' | 'Other';
  meetingLink: string;
  date: Date;
  time: string;
  duration: number;
  status: 'Pending' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  inviteToken?: string;
  inviteTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Constants ───────────────────────────────────────────────

export const MEETING_PLATFORMS = [
  'Google Meet',
  'Microsoft Teams',
  'Zoom',
  'Other',
] as const;

export const INTERVIEW_STATUSES = [
  'Pending',
  'Scheduled',
  'InProgress',
  'Completed',
  'Cancelled',
] as const;

export type MeetingPlatform = (typeof MEETING_PLATFORMS)[number];
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

// ─── Schema ──────────────────────────────────────────────────

const interviewSchema = new Schema<IInterview>(
  {
    title: {
      type: String,
      required: [true, 'Interview title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      maxlength: [100, 'Candidate name must not exceed 100 characters'],
    },
    candidateEmail: {
      type: String,
      required: [true, 'Candidate email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid candidate email address'],
    },
    candidatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    meetingPlatform: {
      type: String,
      required: [true, 'Meeting platform is required'],
      enum: {
        values: MEETING_PLATFORMS,
        message: 'Platform must be one of: Google Meet, Microsoft Teams, Zoom, Other',
      },
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    time: {
      type: String,
      required: [true, 'Interview time is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration must not exceed 480 minutes (8 hours)'],
    },
    status: {
      type: String,
      enum: {
        values: INTERVIEW_STATUSES,
        message: 'Status must be one of: Pending, Scheduled, InProgress, Completed, Cancelled',
      },
      default: 'Scheduled',
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes must not exceed 2000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true,
      index: true,
    },
    inviteToken: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    inviteTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ─────────────────────────────────────────────────

interviewSchema.index({ createdBy: 1, date: -1 });
interviewSchema.index({ createdBy: 1, status: 1 });
interviewSchema.index({ createdBy: 1, createdAt: -1 });

// ─── Model ───────────────────────────────────────────────────

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);
