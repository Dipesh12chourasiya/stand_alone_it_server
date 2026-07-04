import { type Socket } from 'socket.io';
import * as timelineService from '@/features/timeline/services/timeline.service';
import { SOCKET_EVENTS, INTERVIEW_EVENTS, PHONE_EVENTS, WEBRTC_EVENTS } from '@/sockets/events';
import { getIO } from '@/sockets/socketServer';
import type { AuthSocket } from '@/sockets/utils/types';
import type { TimelineEventType, TimelineSeverity } from '@/features/timeline/types';

// ─── Timeline Event Config ──────────────────────────────────────
// Maps client→server action events to timeline event data.

interface EventConfig {
  eventType: TimelineEventType;
  severity: TimelineSeverity;
  message: string;
}

// Maps server→client broadcast events that need timeline recording
const ACTION_EVENT_MAP: Record<string, (payload?: Record<string, unknown>) => EventConfig | null> = {
  // Recruiter starts/ends the interview
  [INTERVIEW_EVENTS.START_INTERVIEW]: () => ({
    eventType: 'interview:started',
    severity: 'SUCCESS',
    message: 'Interview started.',
  }),
  [INTERVIEW_EVENTS.END_INTERVIEW]: () => ({
    eventType: 'interview:ended',
    severity: 'SUCCESS',
    message: 'Interview ended.',
  }),

  // Phone joins a session
  [PHONE_EVENTS.PHONE_JOIN_SESSION]: () => ({
    eventType: 'phone:connected',
    severity: 'SUCCESS',
    message: 'Phone connected successfully.',
  }),

  // Phone device status updates
  [PHONE_EVENTS.PHONE_DEVICE_INFO]: (payload) => {
    const p = payload || {};
    const camStatus = (p.cameraStatus as string) || '';
    const micStatus = (p.micStatus as string) || '';

    // Only create camera/mic events when we know the status
    return null; // Device info is too frequent — handled separately
  },
};

/**
 * Emit a timeline event to the interview room via Socket.IO.
 * Connected clients receive real-time timeline updates without polling.
 */
export function emitTimelineEvent(
  interviewId: string,
  eventType: string,
  severity: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  try {
    const io = getIO();
    io.to(`interview:${interviewId}`).emit('timeline:event', {
      eventType,
      severity,
      message,
      metadata,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Socket.IO may not be initialized yet — fine for REST-only flows.
  }
}

/**
 * Create a timeline event from a socket action, save to DB, and broadcast.
 *
 * This is public so other handlers (interview, phone) can call it
 * directly when they need to record events that don't flow through
 * the action listener pattern.
 */
export async function recordSocketTimelineEvent(
  socket: AuthSocket,
  eventName: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const interviewId = socket.data.interviewId;
  if (!interviewId) return;

  // Resolve session token → interview ID for phone events
  let sessionId = interviewId;
  if (eventName === PHONE_EVENTS.PHONE_JOIN_SESSION) {
    // For phone join, the session token is stored but we need the interview ID
    // The handler stores sessionToken in socket.data, but the interviewId
    // may be null at this point. Skip if no interview context.
    if (!socket.data.interviewId && !socket.data.sessionToken) return;
  }

  const config = ACTION_EVENT_MAP[eventName]?.(payload);
  if (!config) return;

  try {
    const event = await timelineService.createEvent({
      sessionId,
      eventType: config.eventType,
      severity: config.severity,
      message: config.message,
      metadata: { ...payload, triggeredBy: socket.data.role || 'unknown' },
    });

    emitTimelineEvent(sessionId, event.eventType, event.severity, event.message, event.metadata);
  } catch {
    // Never interrupt the primary socket flow for a timeline recording failure.
  }
}

/**
 * Record a timeline event for a phone status update (camera/mic).
 */
export async function recordPhoneDeviceTimeline(
  socket: AuthSocket,
  cameraStatus?: string,
  micStatus?: string,
): Promise<void> {
  const interviewId = socket.data.interviewId;
  if (!interviewId) return;

  const events: Array<{ eventType: TimelineEventType; severity: TimelineSeverity; message: string }> = [];

  if (cameraStatus === 'granted' || cameraStatus === 'enabled') {
    events.push({ eventType: 'camera:enabled', severity: 'SUCCESS', message: 'Camera enabled.' });
  } else if (cameraStatus === 'denied' || cameraStatus === 'disabled') {
    events.push({ eventType: 'camera:disabled', severity: 'WARNING', message: 'Camera disabled.' });
  }

  if (micStatus === 'granted' || micStatus === 'enabled') {
    events.push({ eventType: 'microphone:enabled', severity: 'SUCCESS', message: 'Microphone enabled.' });
  } else if (micStatus === 'denied' || micStatus === 'disabled') {
    events.push({ eventType: 'microphone:disabled', severity: 'WARNING', message: 'Microphone disabled.' });
  }

  for (const evt of events) {
    try {
      const event = await timelineService.createEvent({
        sessionId: interviewId,
        ...evt,
        metadata: { triggeredBy: socket.data.role || 'phone' },
      });
      emitTimelineEvent(interviewId, event.eventType, event.severity, event.message, event.metadata);
    } catch {
      // Non-blocking
    }
  }
}

/**
 * Record a WebRTC connection state change as a timeline event.
 */
export async function recordWebRTCTimeline(
  interviewId: string,
  state: string,
): Promise<void> {
  if (state === 'connected') {
    const event = await timelineService.createEvent({
      sessionId: interviewId,
      eventType: 'webrtc:connected',
      severity: 'SUCCESS',
      message: 'WebRTC connection established.',
      metadata: {},
    });
    emitTimelineEvent(interviewId, event.eventType, event.severity, event.message);
  } else if (state === 'disconnected' || state === 'failed') {
    const event = await timelineService.createEvent({
      sessionId: interviewId,
      eventType: 'webrtc:disconnected',
      severity: 'ERROR',
      message: `WebRTC connection ${state}.`,
      metadata: {},
    });
    emitTimelineEvent(interviewId, event.eventType, event.severity, event.message);
  }
}

/**
 * Register action-event listeners that create timeline entries.
 *
 * Listens for client→server action events (like interview:start, interview:end)
 * and records them in the timeline. For event types that require the interviewId
 * to be set on the socket before the action fires, this works transparently.
 */
export function registerTimelineRecording(socket: Socket): void {
  const authSocket = socket as AuthSocket;

  // Listen for client→server action events
  for (const eventName of Object.keys(ACTION_EVENT_MAP)) {
    socket.on(eventName, (payload?: Record<string, unknown>) => {
      recordSocketTimelineEvent(authSocket, eventName, payload).catch(() => {});
    });
  }
}
