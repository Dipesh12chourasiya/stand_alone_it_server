import { type Socket } from 'socket.io';
import { WEBRTC_EVENTS } from '@/sockets/events';

/**
 * WebRTC signaling relay.
 *
 * Node.js is ONLY the signaling server — media never passes through it.
 * Offers, answers, and ICE candidates are forwarded between peers
 * within the same interview room.
 *
 * Both the recruiter and phone join `interview:${interviewId}` so
 * forwarding to that room reaches the other peer.
 */
export function registerWebRTCHandlers(socket: Socket): void {
  // Resolve the interview room from socket data
  function getTargetRoom(): string | null {
    const { interviewId } = socket.data;
    return interviewId ? `interview:${interviewId}` : null;
  }

  // Forward an offer from one peer to the other
  socket.on(
    WEBRTC_EVENTS.OFFER,
    (payload: { sdp: unknown }) => {
      const { sdp } = payload;
      const role = socket.data.role || 'unknown';

      console.log(`[WebRTC Server] Offer received from ${role}`);

      if (!sdp) {
        console.warn('[WebRTC Server] Invalid offer: missing SDP');
        socket.emit(WEBRTC_EVENTS.NEGOTIATION_FAILED, {
          message: 'Invalid offer: missing SDP',
        });
        return;
      }

      const room = getTargetRoom();
      if (!room) {
        console.warn('[WebRTC Server] Cannot route offer: no interview room for', socket.data.interviewId);
        socket.emit(WEBRTC_EVENTS.NEGOTIATION_FAILED, {
          message: 'Cannot route offer: no interview room joined',
        });
        return;
      }

      console.log(`[WebRTC Server] Forwarding offer to room: ${room}`);
      // Forward to everyone else in the interview room
      socket.to(room).emit(WEBRTC_EVENTS.OFFER_FORWARD, {
        sdp,
        fromRole: socket.data.role,
        timestamp: Date.now(),
      });
    },
  );

  // Forward an answer from one peer to the other
  socket.on(
    WEBRTC_EVENTS.ANSWER,
    (payload: { sdp: unknown }) => {
      const { sdp } = payload;
      const role = socket.data.role || 'unknown';

      console.log(`[WebRTC Server] Answer received from ${role}`);

      if (!sdp) {
        console.warn('[WebRTC Server] Invalid answer: missing SDP');
        socket.emit(WEBRTC_EVENTS.NEGOTIATION_FAILED, {
          message: 'Invalid answer: missing SDP',
        });
        return;
      }

      const room = getTargetRoom();
      if (!room) {
        console.warn('[WebRTC Server] Cannot route answer: no interview room for', socket.data.interviewId);
        socket.emit(WEBRTC_EVENTS.NEGOTIATION_FAILED, {
          message: 'Cannot route answer: no interview room joined',
        });
        return;
      }

      console.log(`[WebRTC Server] Forwarding answer to room: ${room}`);
      socket.to(room).emit(WEBRTC_EVENTS.ANSWER_FORWARD, {
        sdp,
        fromRole: socket.data.role,
        timestamp: Date.now(),
      });
    },
  );

  // Forward an ICE candidate from one peer to the other
  socket.on(
    WEBRTC_EVENTS.ICE_CANDIDATE,
    (payload: { candidate: unknown }) => {
      const { candidate } = payload;
      const role = socket.data.role || 'unknown';

      if (!candidate) {
        // Ignore empty candidates (end-of-candidates marker)
        return;
      }

      const room = getTargetRoom();
      if (!room) {
        console.warn('[WebRTC Server] Cannot route ICE candidate: no room');
        return;
      }

      console.log(`[WebRTC Server] Forwarding ICE candidate from ${role}`);
      socket.to(room).emit(WEBRTC_EVENTS.ICE_CANDIDATE_FORWARD, {
        candidate,
        fromRole: socket.data.role,
        timestamp: Date.now(),
      });
    },
  );

  // Notify room of ICE connection failure
  socket.on(WEBRTC_EVENTS.ICE_FAILURE, () => {
    const room = getTargetRoom();

    if (room) {
      socket.to(room).emit(WEBRTC_EVENTS.ICE_FAILURE, {
        message: 'ICE negotiation failed',
        timestamp: Date.now(),
      });
    }
  });
}
