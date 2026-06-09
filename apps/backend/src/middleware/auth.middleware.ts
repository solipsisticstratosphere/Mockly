import { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyJwt } from '../config/jwks';
import { createUserSupabaseClient } from '../config/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userSupabase?: SupabaseClient;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const decoded = await verifyJwt(token);
    req.userId = decoded.sub as string;
    req.userSupabase = createUserSupabaseClient(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
