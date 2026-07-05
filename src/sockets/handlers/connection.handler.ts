import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, INTERVIEW_EVENTS } from '@/sockets/events';
import type { AuthSocket } from '@/sockets/utils/types';
import { cleanupParticipant } from '@/sockets/handlers/interview.handler';

/**
 * Register heartbeat ping-pong for a socket.
 * Client sends heartbeat → server responds with heartbeat:ack.
 */
export function registerHeartbeat(socket: Socket): void {
  socket.on(SOCKET_EVENTS.HEARTBEAT, () => {
    socket.emit(SOCKET_EVENTS.HEARTBEAT_ACK, { timestamp: Date.now() });
  });
}

/**
 * Track socket metadata on connection.
 */
export function onConnection(socket: AuthSocket): void {
  const { interviewId, role, sessionToken } = socket.data;

  // Tag socket for room-based filtering
  if (interviewId) {
    socket.join(`interview:${interviewId}`);
  }

  if (role === 'recruiter') {
    socket.join(`recruiter:${socket.data.recruiterId}`);
  }

  if (sessionToken) {
    socket.join(`session:${sessionToken}`);
  }

  // Broadcast participant joined (if within an interview context)
  if (interviewId) {
    socket.to(`interview:${interviewId}`).emit(INTERVIEW_EVENTS.PARTICIPANT_JOINED, {
      role,
      userId: socket.data.recruiterId || sessionToken,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Clean up socket data on disconnect and notify room.
 */
export function onDisconnect(socket: AuthSocket): void {
  const { interviewId, role, recruiterId, sessionToken } = socket.data;

  // Clean up participant tracker
  cleanupParticipant(socket);

  if (interviewId) {
    const leaveEvent =
      role === 'phone'
        ? SOCKET_EVENTS.PHONE_DISCONNECTED
        : role === 'recruiter'
          ? SOCKET_EVENTS.RECRUITER_LEFT
          : SOCKET_EVENTS.CANDIDATE_LEFT;

    socket.to(`interview:${interviewId}`).emit(leaveEvent, {
      role,
      userId: recruiterId || sessionToken,
      timestamp: new Date().toISOString(),
    });

    socket.to(`interview:${interviewId}`).emit(INTERVIEW_EVENTS.PARTICIPANT_LEFT, {
      role,
      userId: recruiterId || sessionToken,
      timestamp: new Date().toISOString(),
    });
  }

  // Clean up all rooms the socket was in
  for (const room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
    }
  }
}
