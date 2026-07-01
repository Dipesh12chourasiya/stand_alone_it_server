import mongoose from 'mongoose';
import { env } from '@/config/env';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Database] Connected to MongoDB');
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[Database] Runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Disconnected');
  });
}
