import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
}
