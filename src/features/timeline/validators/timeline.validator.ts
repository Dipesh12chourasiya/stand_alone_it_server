import { z } from 'zod/v4';
import { TIMELINE_EVENT_TYPES, TIMELINE_SEVERITIES } from '../types';

// ─── Create Timeline Event ──────────────────────────────────────

export const createTimelineSchema = z.object({
  sessionId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Session ID must be a valid MongoDB ObjectId'),

  eventType: z.enum(
    [...TIMELINE_EVENT_TYPES] as [string, ...string[]],
    { message: 'Event type must be a valid timeline event type' },
  ),

  severity: z.enum(
    [...TIMELINE_SEVERITIES] as [string, ...string[]],
    { message: 'Severity must be one of: INFO, SUCCESS, WARNING, ERROR' },
  ).default('INFO'),

  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message must not exceed 500 characters'),

  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
});

export type CreateTimelineInput = z.infer<typeof createTimelineSchema>;

// ─── Query Params ───────────────────────────────────────────────

export const timelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventType: z.enum(
    [...TIMELINE_EVENT_TYPES] as [string, ...string[]],
    { message: 'Event type must be a valid timeline event type' },
  ).optional(),
  severity: z.enum(
    [...TIMELINE_SEVERITIES] as [string, ...string[]],
    { message: 'Severity must be one of: INFO, SUCCESS, WARNING, ERROR' },
  ).optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest'], { message: 'Sort must be newest or oldest' }).default('newest'),
});

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;

// ─── ObjectId param ─────────────────────────────────────────────

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid resource identifier');
