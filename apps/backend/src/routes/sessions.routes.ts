import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { CreateSessionSchema, EndSessionSchema } from '@mockly/shared';
import { supabase } from '../lib/supabase';
import { generateQuestion } from '../services/groq.service';
import { upsertDailySnapshot } from '../services/analytics.service';

const router = Router();

router.post('/', authMiddleware, validate(CreateSessionSchema), async (req: any, res) => {
  const { mode, topic } = req.body;
  const { data: profile } = await supabase.from('profiles').select('role, level').eq('id', req.userId).single();

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ user_id: req.userId, mode, topic, role: profile?.role ?? 'general', level: profile?.level ?? 'junior' })
    .select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }

  const q = await generateQuestion({ role: profile?.role ?? 'general', level: profile?.level ?? 'junior', topic });
  const { data: question } = await supabase.from('questions').insert({
    session_id: session.id, topic, category: q.category,
    role: profile?.role ?? 'general', level: profile?.level ?? 'junior',
    text: q.text, order_index: 0,
  }).select().single();

  res.json({ session_id: session.id, first_question: { ...question, key_concepts: q.key_concepts, estimated_answer_minutes: q.estimated_answer_minutes } });
});

router.get('/', authMiddleware, async (req: any, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const from = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from('sessions').select('*', { count: 'exact' })
    .eq('user_id', req.userId).order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ sessions: data, total: count });
});

router.get('/:id', authMiddleware, async (req: any, res) => {
  const { data: session } = await supabase.from('sessions').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
  if (!session) { res.status(404).json({ error: 'Not found' }); return; }
  const { data: questions } = await supabase.from('questions').select('*').eq('session_id', req.params.id).order('order_index');
  const { data: answers } = await supabase.from('answers').select('*').eq('session_id', req.params.id);
  res.json({ session, questions, answers });
});

router.patch('/:id/end', authMiddleware, validate(EndSessionSchema), async (req: any, res) => {
  const { duration_seconds } = req.body;
  const { data: answers } = await supabase.from('answers').select('score').eq('session_id', req.params.id).not('score', 'is', null);
  const scores = (answers ?? []).map((a: any) => a.score);
  const total_score = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;

  const { data: session, error } = await supabase.from('sessions')
    .update({ status: 'completed', total_score, duration_seconds, ended_at: new Date().toISOString() })
    .eq('id', req.params.id).eq('user_id', req.userId).select().single();
  if (error) { res.status(400).json({ error: error.message }); return; }

  await upsertDailySnapshot(req.userId);
  res.json({ session });
});

router.delete('/:id', authMiddleware, async (req: any, res) => {
  await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', req.params.id).eq('user_id', req.userId);
  res.status(204).send();
});

export default router;
