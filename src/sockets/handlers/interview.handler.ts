import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, INTERVIEW_EVENTS } from '@/sockets/events';
import type { AuthSocket } from '@/sockets/utils/types';
import { getIO } from '@/sockets/socketServer';

// ─── Room Participant Tracker ───────────────────────────────────
//
// In-memory map tracking which participants are in each interview room.
// Key: `interview:<interviewId>`
// Value: participant presence flags + socket IDs
//
// When both recruiter and candidate are present, emits
// `interview:both-ready` to the room so WebRTC negotiation can begin.

interface RoomState {
  recruiterSocketId: string | null;
  candidateSocketId: string | null;
}

const roomParticipants = new Map<string, RoomState>();

/**
 * Get the current room state for a given interview room.
 */
function getRoomState(interviewId: string): RoomState {
  const key = `interview:${interviewId}`;
  let state = roomParticipants.get(key);
  if (!state) {
    state = { recruiterSocketId: null, candidateSocketId: null };
    roomParticipants.set(key, state);
  }
  return state;
}

/**
 * Check if both recruiter and candidate are in the same interview room.
 * If so, emit `interview:both-ready` to the room so WebRTC can begin.
 */
function checkBothPresent(room: string): void {
  const key = room.startsWith('interview:') ? room : `interview:${room}`;
  const interviewId = key.replace('interview:', '');
  const state = getRoomState(interviewId);

  if (state.recruiterSocketId && state.candidateSocketId) {
    console.log(`[Server] Both participants ready in room ${key}`);

    try {
      const io = getIO();
      io.to(key).emit(INTERVIEW_EVENTS.BOTH_PARTICIPANTS_READY, {
        recruiterSocketId: state.recruiterSocketId,
        candidateSocketId: state.candidateSocketId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      console.warn('[Server] Socket.IO not initialized, cannot emit both-ready');
    }
  }
}

/**
 * Remove a participant from the tracker when they disconnect or leave.
 */
function removeParticipant(socket: AuthSocket): void {
  const { interviewId, role } = socket.data;
  if (!interviewId) return;

  const state = getRoomState(interviewId);

  if (role === 'recruiter' && state.recruiterSocketId === socket.id) {
    state.recruiterSocketId = null;
    console.log(`[Server] Recruiter left room interview:${interviewId}`);
  } else if (role === 'candidate' && state.candidateSocketId === socket.id) {
    state.candidateSocketId = null;
    console.log(`[Server] Candidate left room interview:${interviewId}`);
  }

  // Clean up empty room states
  if (!state.recruiterSocketId && !state.candidateSocketId) {
    roomParticipants.delete(`interview:${interviewId}`);
  }
}

/**
 * Allow a participant to join an interview room.
 * Validates that the interviewId is provided before joining.
 * Tracks recruiter/candidate presence and emits `interview:both-ready`
 * when both are present.
 */
export function registerInterviewRoom(socket: Socket): void {
  const authSocket = socket as AuthSocket;

  socket.on(
    SOCKET_EVENTS.JOIN_INTERVIEW_ROOM,
    (payload: { interviewId: string; role: string }) => {
      const { interviewId, role } = payload;

      if (!interviewId || typeof interviewId !== 'string') {
        socket.emit('error', { message: 'Invalid interview ID' });
        return;
      }

      // Validate role
      if (role !== 'recruiter' && role !== 'candidate') {
        // Phone role uses phone:join-session — let it pass silently
        if (role === 'phone') {
          // Fall through for phone — still join the room
        } else {
          socket.emit('error', { message: 'Invalid role. Must be recruiter, candidate, or phone.' });
          return;
        }
      }

      const room = `interview:${interviewId}`;
      socket.join(room);

      // Store interview context on the socket
      authSocket.data.interviewId = interviewId;
      authSocket.data.role = role as 'recruiter' | 'candidate' | 'phone';

      console.log(`[Server] ${role} joined room ${room} (socket: ${socket.id})`);

      // Notify others in the room
      socket.to(room).emit(INTERVIEW_EVENTS.PARTICIPANT_JOINED, {
        role,
        userId: authSocket.data.recruiterId || null,
        timestamp: new Date().toISOString(),
      });

      // Track recruiter/candidate presence for both-ready detection
      if (role === 'recruiter') {
        const state = getRoomState(interviewId);
        state.recruiterSocketId = socket.id;
        checkBothPresent(room);
      } else if (role === 'candidate') {
        const state = getRoomState(interviewId);
        state.candidateSocketId = socket.id;
        checkBothPresent(room);
      }
    },
  );

  socket.on(SOCKET_EVENTS.LEAVE_INTERVIEW_ROOM, () => {
    const { interviewId } = authSocket.data;

    if (interviewId) {
      console.log(`[Server] Socket ${socket.id} leaving interview:${interviewId}`);
      socket.leave(`interview:${interviewId}`);
      removeParticipant(authSocket);
      authSocket.data.interviewId = undefined;
      authSocket.data.role = undefined;
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

/**
 * Call from connection.handler onDisconnect to clean up participant tracking.
 */
export function cleanupParticipant(socket: AuthSocket): void {
  removeParticipant(socket);
}
