// ─── Event Types ────────────────────────────────────────────────
// Each event type maps to a specific action in the interview lifecycle.

export const TIMELINE_EVENT_TYPES = [
  'interview:started',
  'interview:ended',
  'recruiter:joined',
  'recruiter:left',
  'candidate:joined',
  'candidate:left',
  'phone:connected',
  'phone:disconnected',
  'camera:enabled',
  'camera:disabled',
  'microphone:enabled',
  'microphone:disabled',
  'waiting-room:joined',
  'waiting-room:left',
  'webrtc:connected',
  'webrtc:disconnected',
  'candidate:reconnected',
  'recruiter:reconnected',
  'device:verified',
  'interview:status-updated',
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

// ─── Severity Levels ────────────────────────────────────────────

export const TIMELINE_SEVERITIES = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'] as const;
export type TimelineSeverity = (typeof TIMELINE_SEVERITIES)[number];

// ─── Timeline Event (plain object shape) ────────────────────────

export interface TimelineEvent {
  id: string;
  sessionId: string;
  eventType: TimelineEventType;
  severity: TimelineSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Paginated response ─────────────────────────────────────────

export interface TimelineListData {
  events: TimelineEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Create event input ─────────────────────────────────────────

export interface CreateTimelineInput {
  sessionId: string;
  eventType: TimelineEventType;
  severity: TimelineSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

// ─── Query params ───────────────────────────────────────────────

export interface TimelineQuery {
  page?: number;
  limit?: number;
  eventType?: TimelineEventType;
  severity?: TimelineSeverity;
  search?: string;
  sort?: 'newest' | 'oldest';
}
