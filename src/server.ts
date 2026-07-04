import http from 'http';
import app from '@/app';
import { env } from '@/config/env';
import { connectDatabase } from '@/config/database';
import { createSocketServer } from '@/sockets';

async function start() {
  await connectDatabase();

  // Create HTTP server (required for Socket.IO to attach)
  const httpServer = http.createServer(app);

  // Attach Socket.IO to the HTTP server
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`[Socket.IO] WebSocket server attached`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
