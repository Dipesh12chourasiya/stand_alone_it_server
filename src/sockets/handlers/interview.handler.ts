import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, INTERVIEW_EVENTS } from '@/sockets/events';
import type { AuthSocket } from '@/sockets/utils/types';

/**
 * Allow a participant to join an interview room.
 * Validates that the interviewId is provided before joining.
 */
export function registerInterviewRoom(socket: Socket): void {
  socket.on(
    SOCKET_EVENTS.JOIN_INTERVIEW_ROOM,
    (payload: { interviewId: string; role: string }) => {
      const { interviewId, role } = payload;

      if (!interviewId || typeof interviewId !== 'string') {
        socket.emit('error', { message: 'Invalid interview ID' });
        return;
      }

      const room = `interview:${interviewId}`;
      socket.join(room);

      // Store interview context on the socket
      (socket as AuthSocket).data.interviewId = interviewId;
      (socket as AuthSocket).data.role = role;

      // Notify others in the room
      socket.to(room).emit(INTERVIEW_EVENTS.PARTICIPANT_JOINED, {
        role,
        userId: (socket as AuthSocket).data.recruiterId || null,
        timestamp: new Date().toISOString(),
      });
    },
  );

  socket.on(SOCKET_EVENTS.LEAVE_INTERVIEW_ROOM, () => {
    const authSocket = socket as AuthSocket;
    const { interviewId } = authSocket.data;

    if (interviewId) {
      socket.leave(`interview:${interviewId}`);
      authSocket.data.interviewId = undefined;
    }
  });

  // Recruiter starts the interview => broadcast to room
  // (Timeline DB entry + realtime update handled by timeline.handler action listener)
  socket.on(INTERVIEW_EVENTS.START_INTERVIEW, (payload: { interviewId: string }) => {
    const { interviewId } = payload;
    if (!interviewId) return;

    socket.to(`interview:${interviewId}`).emit(INTERVIEW_EVENTS.INTERVIEW_STARTED, {
      startedAt: new Date().toISOString(),
    });
  });

  // Recruiter ends the interview => broadcast to room
  socket.on(INTERVIEW_EVENTS.END_INTERVIEW, (payload: { interviewId: string }) => {
    const { interviewId } = payload;
    if (!interviewId) return;

    socket.to(`interview:${interviewId}`).emit(INTERVIEW_EVENTS.INTERVIEW_ENDED, {
      endedAt: new Date().toISOString(),
    });
  });
}
