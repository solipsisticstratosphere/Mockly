import { Response } from 'express';
import { supabase } from '../config/supabase';
import { generateQuestion } from '../services/groq.service';
import type { AuthRequest } from '../middleware/auth.middleware';

export async function nextQuestion(req: AuthRequest, res: Response) {
  const { session_id, previous_answer_score } = req.body;
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', req.userId)
    .single();
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { data: prevQuestions } = await supabase
    .from('questions')
    .select('text, order_index')
    .eq('session_id', session_id)
    .order('order_index');
  const typedPrevQuestions = prevQuestions as { text: string }[] | null;
  const previousQuestions = (typedPrevQuestions ?? []).map(q => q.text);
  const nextIndex = prevQuestions?.length ?? 0;

  const q = await generateQuestion({
    role: session.role,
    level: session.level,
    topic: session.topic,
    mode: session.mode,
    previousQuestions,
    lastScore: previous_answer_score,
  });

  const { data: question } = await supabase
    .from('questions')
    .insert({
      session_id,
      topic: session.topic,
      category: q.category,
      role: session.role,
      level: session.level,
      text: q.text,
      order_index: nextIndex,
    })
    .select()
    .single();

  await supabase
    .from('sessions')
    .update({ question_count: nextIndex + 1 })
    .eq('id', session_id);
  res.json({
    question: {
      ...question,
      key_concepts: q.key_concepts,
      estimated_answer_minutes: q.estimated_answer_minutes,
    },
  });
}

export async function followUpQuestion(req: AuthRequest, res: Response) {
  const { session_id, question_id } = req.body;
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', req.userId)
    .single();
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const q = await generateQuestion({
    role: session.role,
    level: session.level,
    topic: session.topic,
  });

  const { data: question } = await supabase
    .from('questions')
    .insert({
      session_id,
      topic: session.topic,
      category: q.category,
      role: session.role,
      level: session.level,
      text: q.text,
      follow_up_of: question_id,
    })
    .select()
    .single();

  res.json({ question });
}

export async function getQuestionBank(req: AuthRequest, res: Response) {
  const { topic, role, level } = req.query;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const from = (page - 1) * limit;
  let q = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('is_template', true)
    .range(from, from + limit - 1);
  if (topic) q = q.eq('topic', topic);
  if (role) q = q.eq('role', role);
  if (level) q = q.eq('level', level);
  const { data, count, error } = await q;
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ questions: data, total: count });
}

export async function saveToBank(req: AuthRequest, res: Response) {
  const { data: question } = await supabase
    .from('questions')
    .select('id, is_template, session_id')
    .eq('id', req.params.id)
    .single();

  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  if (question.session_id) {
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', question.session_id)
      .eq('user_id', req.userId)
      .single();
    if (!session) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const newValue = !question.is_template;
  const { error } = await supabase
    .from('questions')
    .update({ is_template: newValue })
    .eq('id', req.params.id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ question_id: req.params.id, is_template: newValue });
}
