import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { AuthRequest } from './auth.middleware';

// Лимит на LLM-эндпоинты: 30 запросов на пользователя за 15 минут
export const llmRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req: AuthRequest) => req.userId ?? ipKeyGenerator(req),
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
