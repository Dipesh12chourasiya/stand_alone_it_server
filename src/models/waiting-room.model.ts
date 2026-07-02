import mongoose, { Schema, Document } from 'mongoose';

export interface IWaitingRoom extends Document {
  interviewId: mongoose.Types.ObjectId;
  status: 'Waiting' | 'RecruiterJoined' | 'InterviewStarted' | 'InterviewEnded' | 'Expired';
  candidateJoinedAt?: Date;
  recruiterJoinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const WAITING_ROOM_STATUSES = [
  'Waiting',
  'RecruiterJoined',
  'InterviewStarted',
  'InterviewEnded',
  'Expired',
] as const;

export type WaitingRoomStatus = (typeof WAITING_ROOM_STATUSES)[number];

const waitingRoomSchema = new Schema<IWaitingRoom>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: WAITING_ROOM_STATUSES,
        message: 'Status must be one of: Waiting, RecruiterJoined, InterviewStarted, InterviewEnded, Expired',
      },
      default: 'Waiting',
    },
    candidateJoinedAt: {
      type: Date,
      default: null,
    },
    recruiterJoinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const WaitingRoom = mongoose.model<IWaitingRoom>('WaitingRoom', waitingRoomSchema);
