import mongoose, { Schema, type Document } from 'mongoose';
import { TIMELINE_EVENT_TYPES, TIMELINE_SEVERITIES } from '../types';
import type { TimelineEventType, TimelineSeverity } from '../types';

// ─── Document Interface ─────────────────────────────────────────

export interface ITimeline extends Document {
  sessionId: mongoose.Types.ObjectId;
  eventType: TimelineEventType;
  severity: TimelineSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────

const timelineSchema = new Schema<ITimeline>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: [true, 'Session (interview) ID is required'],
      // Compound indexes including sessionId are defined via schema.index() below
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: TIMELINE_EVENT_TYPES,
        message: 'Event type must be a valid timeline event type',
      },
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: TIMELINE_SEVERITIES,
        message: 'Severity must be one of: INFO, SUCCESS, WARNING, ERROR',
      },
      default: 'INFO',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message must not exceed 500 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ────────────────────────────────────────────────────

// Primary lookup: all events for a session, sorted by recency
timelineSchema.index({ sessionId: 1, createdAt: -1 });

// Filtered queries: events by type within a session
timelineSchema.index({ sessionId: 1, eventType: 1, createdAt: -1 });

// Filtered queries: events by severity within a session
timelineSchema.index({ sessionId: 1, severity: 1, createdAt: -1 });

// ─── Model ──────────────────────────────────────────────────────

export const Timeline = mongoose.model<ITimeline>('Timeline', timelineSchema);
