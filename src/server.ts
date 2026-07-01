import app from '@/app';
import { env } from '@/config/env';
import { connectDatabase } from '@/config/database';

async function start() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`[Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
