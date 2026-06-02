import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { NextQuestionSchema, FollowUpQuestionSchema, QuestionBankQuerySchema } from '@mockly/shared';
import { supabase } from '../lib/supabase';
import { generateQuestion } from '../services/groq.service';

const router = Router();

router.post('/next', authMiddleware, validate(NextQuestionSchema), async (req: any, res) => {
  const { session_id, previous_answer_score } = req.body;
  const { data: session } = await supabase.from('sessions').select('*').eq('id', session_id).eq('user_id', req.userId).single();
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  const { data: prevQuestions } = await supabase.from('questions').select('topic, order_index').eq('session_id', session_id).order('order_index');
  const prevTopics = (prevQuestions ?? []).map((q: any) => q.topic);
  const nextIndex = (prevQuestions?.length ?? 0);

  const q = await generateQuestion({
    role: session.role, level: session.level, topic: session.topic,
    previousTopics: prevTopics, lastScore: previous_answer_score,
  });

  const { data: question } = await supabase.from('questions').insert({
    session_id, topic: session.topic, category: q.category,
    role: session.role, level: session.level, text: q.text, order_index: nextIndex,
  }).select().single();

  await supabase.from('sessions').update({ question_count: nextIndex + 1 }).eq('id', session_id);
  res.json({ question: { ...question, key_concepts: q.key_concepts, estimated_answer_minutes: q.estimated_answer_minutes } });
});

router.post('/followup', authMiddleware, validate(FollowUpQuestionSchema), async (req: any, res) => {
  const { session_id, question_id, answer_text } = req.body;
  const { data: session } = await supabase.from('sessions').select('*').eq('id', session_id).single();
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  const { data: parent } = await supabase.from('questions').select('text, topic').eq('id', question_id).single();
  const q = await generateQuestion({ role: session.role, level: session.level, topic: session.topic });

  const { data: question } = await supabase.from('questions').insert({
    session_id, topic: session.topic, category: q.category,
    role: session.role, level: session.level, text: q.text, follow_up_of: question_id,
  }).select().single();

  res.json({ question });
});

router.get('/bank', authMiddleware, validate(QuestionBankQuerySchema, 'query'), async (req: any, res) => {
  const { topic, role, level, page, limit } = req.query;
  const from = (page - 1) * limit;
  let q = supabase.from('questions').select('*', { count: 'exact' }).eq('is_template', true).range(from, from + limit - 1);
  if (topic) q = q.eq('topic', topic);
  if (role) q = q.eq('role', role);
  if (level) q = q.eq('level', level);
  const { data, count, error } = await q;
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ questions: data, total: count });
});

export default router;
