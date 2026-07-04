// ─── Phone connection events ───────────────────────────────────

export const PHONE_EVENTS = {
  // Server -> client (recruiter)
  PHONE_CONNECTED: 'phone:connected',
  PHONE_DISCONNECTED: 'phone:disconnected',
  PHONE_STATUS: 'phone:status',
  PHONE_CAMERA_READY: 'phone:camera-ready',
  PHONE_MIC_READY: 'phone:mic-ready',
  PHONE_BATTERY: 'phone:battery',
  PHONE_NETWORK: 'phone:network',

  // Client -> server (phone)
  PHONE_JOIN_SESSION: 'phone:join-session',
  PHONE_LEAVE_SESSION: 'phone:leave-session',
  PHONE_UPDATE_STATUS: 'phone:update-status',
  PHONE_DEVICE_INFO: 'phone:device-info',
} as const;
