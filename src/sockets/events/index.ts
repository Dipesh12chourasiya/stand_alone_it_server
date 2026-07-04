export { SOCKET_EVENTS } from './connection.events';
export { INTERVIEW_EVENTS } from './interview.events';
export { PHONE_EVENTS } from './phone.events';
export { WEBRTC_EVENTS } from './webrtc.events';

// ─── Timeline Events ────────────────────────────────────────────
// These are aliases for commonly grouped timeline-related events.

export const TIMELINE_EVENTS = {
  TIMELINE_EVENT: 'timeline:event',
} as const;
