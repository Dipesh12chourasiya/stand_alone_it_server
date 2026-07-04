// ─── Interview room events ────────────────────────────────────

export const INTERVIEW_EVENTS = {
  // State changes server -> client
  INTERVIEW_STARTED: 'interview:started',
  INTERVIEW_ENDED: 'interview:ended',
  STATUS_UPDATED: 'interview:status-updated',

  // Actions client -> server
  START_INTERVIEW: 'interview:start',
  END_INTERVIEW: 'interview:end',
  UPDATE_STATUS: 'interview:update-status',

  // Participant tracking
  PARTICIPANT_JOINED: 'interview:participant-joined',
  PARTICIPANT_LEFT: 'interview:participant-left',
} as const;
