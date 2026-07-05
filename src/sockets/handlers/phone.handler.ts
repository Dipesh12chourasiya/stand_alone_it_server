import { type Socket } from 'socket.io';
import { PHONE_EVENTS } from '@/sockets/events';
import type { AuthSocket } from '@/sockets/utils/types';
import { recordPhoneDeviceTimeline } from '@/sockets/handlers/timeline.handler';
import { PhoneSession } from '@/models/phone-session.model';

/**
 * Handle phone connection lifecycle events.
 *
 * The phone joins a session via its session token and also joins
 * the interview room so the recruiter (already in that room)
 * receives status updates and WebRTC signals.
 */
export function registerPhoneHandlers(socket: Socket): void {
  const authSocket = socket as AuthSocket;

  // Phone joins the session room AND the interview room
  socket.on(
    PHONE_EVENTS.PHONE_JOIN_SESSION,
    async (payload: {
      sessionToken: string;
      deviceInfo?: Record<string, unknown>;
      interviewId?: string;
    }) => {
      const { sessionToken, deviceInfo, interviewId: providedInterviewId } = payload;

      if (!sessionToken || typeof sessionToken !== 'string') {
        socket.emit('error', { message: 'Invalid session token' });
        return;
      }

      authSocket.data.sessionToken = sessionToken;
      authSocket.data.role = 'phone';

      // Join the session room (phone-specific room)
      socket.join(`session:${sessionToken}`);

      // If interviewId was provided in the payload, use it directly.
      // Otherwise fall back to a DB lookup.
      let interviewId = providedInterviewId;

      if (!interviewId) {
        try {
          const session = await PhoneSession.findOne({ sessionToken });
          if (session) {
            interviewId = String(session.interviewId);
          }
        } catch {
          // DB lookup failed — session room join remains intact
        }
      }

      if (interviewId) {
        socket.join(`interview:${interviewId}`);
        authSocket.data.interviewId = interviewId;
      }

      // Store device info
      if (deviceInfo) {
        authSocket.data.deviceInfo = deviceInfo;
      }

      // Emit connected event back to the phone (direct acknowledgement)
      socket.emit(PHONE_EVENTS.PHONE_CONNECTED, {
        connectedAt: new Date().toISOString(),
        deviceInfo,
      });

      // Also notify the interview room that the phone connected
      const interviewRoom = authSocket.data.interviewId
        ? `interview:${authSocket.data.interviewId}`
        : null;

      if (interviewRoom) {
        socket.to(interviewRoom).emit(PHONE_EVENTS.PHONE_CONNECTED, {
          connectedAt: new Date().toISOString(),
          deviceInfo,
        });
      }
    },
  );

  // Phone leaves the session
  socket.on(PHONE_EVENTS.PHONE_LEAVE_SESSION, () => {
    const { sessionToken } = authSocket.data;

    if (sessionToken) {
      socket.to(`session:${sessionToken}`).emit(PHONE_EVENTS.PHONE_DISCONNECTED, {
        disconnectedAt: new Date().toISOString(),
      });

      socket.leave(`session:${sessionToken}`);
      authSocket.data.sessionToken = undefined;
      authSocket.data.role = undefined;
    }
  });

  // Phone sends device info (battery, network, etc.)
  socket.on(
    PHONE_EVENTS.PHONE_DEVICE_INFO,
    (payload: {
      battery?: { level: number; charging: boolean };
      network?: { type: string; effectiveType?: string };
      cameraStatus?: string;
      micStatus?: string;
    }) => {
      const { sessionToken, interviewId } = authSocket.data;

      if (!sessionToken && !interviewId) return;

      // Forward to both the session room AND the interview room
      // (recruiter may be listening in either/both)
      const targets: string[] = [];
      if (sessionToken) targets.push(`session:${sessionToken}`);
      if (interviewId) targets.push(`interview:${interviewId}`);

      for (const room of targets) {
        socket.to(room).emit(PHONE_EVENTS.PHONE_STATUS, {
          ...payload,
          timestamp: new Date().toISOString(),
        });
      }

      // Record camera/mic changes in the timeline
      recordPhoneDeviceTimeline(authSocket, payload.cameraStatus, payload.micStatus).catch(() => {});

      if (payload.cameraStatus) {
        for (const room of targets) {
          socket
            .to(room)
            .emit(PHONE_EVENTS.PHONE_CAMERA_READY, { status: payload.cameraStatus });
        }
      }

      if (payload.micStatus) {
        for (const room of targets) {
          socket
            .to(room)
            .emit(PHONE_EVENTS.PHONE_MIC_READY, { status: payload.micStatus });
        }
      }

      if (payload.battery) {
        for (const room of targets) {
          socket
            .to(room)
            .emit(PHONE_EVENTS.PHONE_BATTERY, payload.battery);
        }
      }

      if (payload.network) {
        for (const room of targets) {
          socket
            .to(room)
            .emit(PHONE_EVENTS.PHONE_NETWORK, payload.network);
        }
      }
    },
  );
}
