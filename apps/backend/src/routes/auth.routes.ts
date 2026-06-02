import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UpdateProfileSchema, CreateProfileSchema } from '@mockly/shared';
import { supabase } from '../lib/supabase';

const router = Router();

router.post('/profile', authMiddleware, validate(CreateProfileSchema), async (req: any, res) => {
  const { full_name, role, level } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, role, level, updated_at: new Date().toISOString() })
    .eq('id', req.userId)
    .select()
    .single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ profile: data });
});

router.get('/profile', authMiddleware, async (req: any, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.userId).single();
  if (error) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json({ profile: data });
});

router.put('/profile', authMiddleware, validate(UpdateProfileSchema), async (req: any, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.userId)
    .select()
    .single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ profile: data });
});

export default router;
