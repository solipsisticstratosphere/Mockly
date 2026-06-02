import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import sessionsRoutes from './routes/sessions.routes';
import questionsRoutes from './routes/questions.routes';
import answersRoutes from './routes/answers.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorMiddleware);

export default app;
