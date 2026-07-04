// ─── Connection lifecycle events ───────────────────────────────

export const SOCKET_EVENTS = {
  // Server -> Client
  RECRUITER_CONNECTED: 'recruiter:connected',
  CANDIDATE_CONNECTED: 'candidate:connected',
  PHONE_CONNECTED: 'phone:connected',
  PHONE_DISCONNECTED: 'phone:disconnected',
  RECRUITER_LEFT: 'recruiter:left',
  CANDIDATE_LEFT: 'candidate:left',
  HEARTBEAT_ACK: 'heartbeat:ack',

  // Client -> Server
  JOIN_INTERVIEW_ROOM: 'interview:join',
  LEAVE_INTERVIEW_ROOM: 'interview:leave',
  HEARTBEAT: 'heartbeat',

  // Connection state
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Timeline (server -> client)
  TIMELINE_EVENT: 'timeline:event',
} as const;
