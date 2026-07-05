import { type Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '@/config/env';
import { authenticateSocket } from '@/sockets/utils/authenticate-socket';
import { onConnection, onDisconnect, registerHeartbeat } from '@/sockets/handlers/connection.handler';
import { registerInterviewRoom } from '@/sockets/handlers/interview.handler';
import { registerPhoneHandlers } from '@/sockets/handlers/phone.handler';
import { registerWebRTCHandlers } from '@/sockets/handlers/webrtc.handler';
import { registerTimelineRecording } from '@/sockets/handlers/timeline.handler';
import type { AuthSocket } from '@/sockets/utils/types';

let io: Server | null = null;

/**
 * Create and configure the Socket.IO server, attached to the HTTP server.
 */
export function createSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        env.CLIENT_URL,
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Production-tuned transport settings
    pingInterval: 25_000, // heartbeat every 25s
    pingTimeout: 20_000, // disconnect if no response in 20s
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthSocket;

    // Lifecycle
    onConnection(socket);
    registerHeartbeat(socket);

    // Feature handlers
    registerInterviewRoom(socket);
    registerPhoneHandlers(socket);
    registerWebRTCHandlers(socket);
    registerTimelineRecording(socket);

    socket.on('disconnect', () => {
      onDisconnect(socket);
    });
  });

  return io;
}

/**
 * Get the running Socket.IO instance (null before createSocketServer is called).
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call createSocketServer first.');
  }
  return io;
}
