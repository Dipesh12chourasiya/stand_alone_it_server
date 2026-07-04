import { type Socket } from 'socket.io';
import { WEBRTC_EVENTS } from '@/sockets/events';

/**
 * WebRTC signaling relay.
 *
 * Node.js is ONLY the signaling server — media never passes through it.
 * Offers, answers, and ICE candidates are forwarded between peers
 * within the same interview room.
 */
export function registerWebRTCHandlers(socket: Socket): void {
  // Forward an offer from one peer to the other
  socket.on(
    WEBRTC_EVENTS.OFFER,
    (payload: { sdp: unknown; toRole: string }) => {
      const { sdp, toRole } = payload;

      if (!sdp) {
        socket.emit(WEBRTC_EVENTS.NEGOTIATION_FAILED, {
          message: 'Invalid offer: missing SDP',
        });
        return;
      }

      // Forward to the target peer (the one with the opposite role in the same room)
      socket.to(`role:${toRole}`).emit(WEBRTC_EVENTS.OFFER_FORWARD, {
        sdp,
        fromRole: socket.data.role,
        timestamp: Date.now(),
      });
    },
  );

  // Forward an answer from one peer to the other
  socket.on(
    WEBRTC_EVENTS.ANSWER,
    (payload: { sdp: unknown; toRole: string }) => {
      const { sdp, toRole } = payload;

      if (!sdp) {
        socket.emit(WEBRTC_EVENTS.NEGOTIATION_FAILED, {
          message: 'Invalid answer: missing SDP',
        });
        return;
      }

      socket.to(`role:${toRole}`).emit(WEBRTC_EVENTS.ANSWER_FORWARD, {
        sdp,
        fromRole: socket.data.role,
        timestamp: Date.now(),
      });
    },
  );

  // Forward an ICE candidate from one peer to the other
  socket.on(
    WEBRTC_EVENTS.ICE_CANDIDATE,
    (payload: { candidate: unknown; toRole: string }) => {
      const { candidate, toRole } = payload;

      if (!candidate) {
        // Ignore empty candidates (end-of-candidates marker)
        return;
      }

      socket.to(`role:${toRole}`).emit(WEBRTC_EVENTS.ICE_CANDIDATE_FORWARD, {
        candidate,
        fromRole: socket.data.role,
        timestamp: Date.now(),
      });
    },
  );

  // Notify room of ICE connection failure
  socket.on(WEBRTC_EVENTS.ICE_FAILURE, () => {
    const room = [...socket.rooms].find((r) => r.startsWith('interview:'));

    if (room) {
      socket.to(room).emit(WEBRTC_EVENTS.ICE_FAILURE, {
        message: 'ICE negotiation failed',
        timestamp: Date.now(),
      });
    }
  });
}
