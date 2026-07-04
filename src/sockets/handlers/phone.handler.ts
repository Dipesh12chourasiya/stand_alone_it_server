import { type Socket } from 'socket.io';
import { PHONE_EVENTS } from '@/sockets/events';
import type { AuthSocket } from '@/sockets/utils/types';
import { recordPhoneDeviceTimeline } from '@/sockets/handlers/timeline.handler';

/**
 * Handle phone connection lifecycle events.
 *
 * The phone joins a session via its session token, which maps
 * to the interview room so the recruiter receives status updates.
 */
export function registerPhoneHandlers(socket: Socket): void {
  const authSocket = socket as AuthSocket;

  // Phone joins the session room
  socket.on(
    PHONE_EVENTS.PHONE_JOIN_SESSION,
    (payload: { sessionToken: string; deviceInfo?: Record<string, unknown> }) => {
      const { sessionToken, deviceInfo } = payload;

      if (!sessionToken || typeof sessionToken !== 'string') {
        socket.emit('error', { message: 'Invalid session token' });
        return;
      }

      authSocket.data.sessionToken = sessionToken;
      authSocket.data.role = 'phone';

      // Join the session room
      socket.join(`session:${sessionToken}`);

      // Store device info
      if (deviceInfo) {
        authSocket.data.deviceInfo = deviceInfo;
      }

      // Notify session room that a phone connected
      socket.to(`session:${sessionToken}`).emit(PHONE_EVENTS.PHONE_CONNECTED, {
        connectedAt: new Date().toISOString(),
        deviceInfo,
      });
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
      const { sessionToken } = authSocket.data;

      if (!sessionToken) return;

      // Forward to the session room (recruiter's client)
      socket.to(`session:${sessionToken}`).emit(PHONE_EVENTS.PHONE_STATUS, {
        ...payload,
        timestamp: new Date().toISOString(),
      });

      // Record camera/mic changes in the timeline
      recordPhoneDeviceTimeline(authSocket, payload.cameraStatus, payload.micStatus).catch(() => {});

      if (payload.cameraStatus) {
        socket
          .to(`session:${sessionToken}`)
          .emit(PHONE_EVENTS.PHONE_CAMERA_READY, { status: payload.cameraStatus });
      }

      if (payload.micStatus) {
        socket
          .to(`session:${sessionToken}`)
          .emit(PHONE_EVENTS.PHONE_MIC_READY, { status: payload.micStatus });
      }

      if (payload.battery) {
        socket
          .to(`session:${sessionToken}`)
          .emit(PHONE_EVENTS.PHONE_BATTERY, payload.battery);
      }

      if (payload.network) {
        socket
          .to(`session:${sessionToken}`)
          .emit(PHONE_EVENTS.PHONE_NETWORK, payload.network);
      }
    },
  );
}
