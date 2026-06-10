import { Response } from 'express';
import { supabase } from '../config/supabase';
import type { AuthRequest } from '../middleware/auth.middleware';

export async function createProfile(req: AuthRequest, res: Response) {
  const { full_name, role, level } = req.body;
  const updates: Record<string, unknown> = { role, level, updated_at: new Date().toISOString() };
  if (full_name !== undefined) updates.full_name = full_name;
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.userId)
    .select()
    .single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ profile: data });
}

export async function getProfile(req: AuthRequest, res: Response) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.userId).single();
  if (error) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json({ profile: data });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.userId)
    .select()
    .single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ profile: data });
}
