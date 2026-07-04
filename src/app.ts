import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import authRoutes from '@/routes/auth.routes';
import interviewRoutes from '@/routes/interview.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import candidateRoutes from '@/routes/candidate.routes';
import phoneRoutes from '@/routes/phone.routes';
import timelineRoutes from '@/features/timeline/routes/timeline.routes';
import reportRoutes from '@/features/reports/routes/report.routes';
import { errorHandler } from '@/middlewares/error-handler';

const app = express();

// middlewares
app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// Parse JSON request bodies (limit to 10kb for security)
app.use(express.json({ limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', data: null });
});

// routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/phone', phoneRoutes);
app.use('/api/v1/timeline', timelineRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(errorHandler);

export default app;
