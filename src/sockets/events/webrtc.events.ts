// ─── WebRTC signaling events ───────────────────────────────────

export const WEBRTC_EVENTS = {
  // Client -> server (signaling relay)
  OFFER: 'webrtc:offer',
  ANSWER: 'webrtc:answer',
  ICE_CANDIDATE: 'webrtc:ice-candidate',

  // Server -> client (signaling forward)
  OFFER_FORWARD: 'webrtc:offer-forward',
  ANSWER_FORWARD: 'webrtc:answer-forward',
  ICE_CANDIDATE_FORWARD: 'webrtc:ice-candidate-forward',

  // Connection state
  CONNECTION_STATE: 'webrtc:connection-state',
  NEGOTIATION_FAILED: 'webrtc:negotiation-failed',
  ICE_FAILURE: 'webrtc:ice-failure',
} as const;
