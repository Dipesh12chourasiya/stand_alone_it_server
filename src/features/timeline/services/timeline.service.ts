import { Timeline, type ITimeline } from '../models/timeline.model';
import type { TimelineEvent, TimelineListData } from '../types';
import type { CreateTimelineInput, TimelineQuery } from '../validators/timeline.validator';

// ─── Domain Error ───────────────────────────────────────────────

export class TimelineError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'TimelineError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function toEvent(doc: ITimeline): TimelineEvent {
  return {
    id: String(doc._id),
    sessionId: String(doc.sessionId),
    eventType: doc.eventType as TimelineEvent['eventType'],
    severity: doc.severity as TimelineEvent['severity'],
    message: doc.message,
    metadata: doc.metadata ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

function buildSort(sort: string): Record<string, 1 | -1> {
  return sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
}

// ─── Create Event ───────────────────────────────────────────────
// Publicly reusable — future services (AI, browser monitoring, etc.)
// can call this to record events without knowing the storage layer.

export async function createEvent(input: CreateTimelineInput): Promise<TimelineEvent> {
  // Cast Zod-inferred string types to the Timeline schema's expected enums
  const doc = await Timeline.create({
    sessionId: input.sessionId,
    eventType: input.eventType as TimelineEvent['eventType'],
    severity: input.severity as TimelineEvent['severity'],
    message: input.message,
    metadata: input.metadata ?? {},
  });

  return toEvent(doc);
}

// ─── Create Bulk Events ─────────────────────────────────────────
// For importing a batch of events at once (e.g. during report generation).

export async function createBulkEvents(
  inputs: CreateTimelineInput[],
): Promise<TimelineEvent[]> {
  const docs = await Timeline.insertMany(
    inputs.map((input) => ({
      sessionId: input.sessionId,
      eventType: input.eventType as TimelineEvent['eventType'],
      severity: input.severity as TimelineEvent['severity'],
      message: input.message,
      metadata: input.metadata ?? {},
    })),
    { ordered: false },
  );

  return docs.map(toEvent);
}

// ─── List events for a session ─────────────────────────────────

export async function listEvents(
  sessionId: string,
  query: TimelineQuery,
): Promise<TimelineListData> {
  const { page, limit, eventType, severity, search, sort } = query;

  const filter: Record<string, unknown> = { sessionId };

  if (eventType) filter.eventType = eventType;
  if (severity) filter.severity = severity;
  if (search) {
    filter.message = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const sortObj = buildSort(sort);

  const [docs, total] = await Promise.all([
    Timeline.find(filter as any).sort(sortObj).skip(skip).limit(limit).lean(),
    Timeline.countDocuments(filter),
  ]);

  return {
    events: docs.map((doc) => toEvent(doc as unknown as ITimeline)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Get all events for a session (unpaginated, for export) ────

export async function getAllEvents(sessionId: string): Promise<TimelineEvent[]> {
  const docs = await Timeline.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  return docs.map((doc) => toEvent(doc as unknown as ITimeline));
}

// ─── Delete all events for a session ───────────────────────────
// Called when an interview is deleted to clean up related data.

export async function deleteSessionEvents(sessionId: string): Promise<void> {
  await Timeline.deleteMany({ sessionId });
}
