import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './config/logger';
import authRoutes from './routes/auth.routes';
import sessionsRoutes from './routes/sessions.routes';
import questionsRoutes from './routes/questions.routes';
import answersRoutes from './routes/answers.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? false }));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorMiddleware);

export default app;
