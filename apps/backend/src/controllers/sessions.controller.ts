import { Response } from 'express';
import { supabase } from '../config/supabase';
import { generateQuestion } from '../services/groq.service';
import { upsertDailySnapshot } from '../services/analytics.service';
import type { AuthRequest } from '../middleware/auth.middleware';

export async function createSession(req: AuthRequest, res: Response) {
  const { mode, topic } = req.body;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, level')
    .eq('id', req.userId)
    .single();

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: req.userId,
      mode,
      topic,
      role: profile?.role ?? 'general',
      level: profile?.level ?? 'junior',
    })
    .select()
    .single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  try {
    const q = await generateQuestion({
      role: profile?.role ?? 'general',
      level: profile?.level ?? 'junior',
      topic,
      mode,
    });
    const { data: question, error: qError } = await supabase
      .from('questions')
      .insert({
        session_id: session.id,
        topic,
        category: q.category,
        role: profile?.role ?? 'general',
        level: profile?.level ?? 'junior',
        text: q.text,
        order_index: 0,
      })
      .select()
      .single();

    if (qError) throw qError;

    res.json({
      session_id: session.id,
      first_question: {
        ...question,
        key_concepts: q.key_concepts,
        estimated_answer_minutes: q.estimated_answer_minutes,
      },
    });
  } catch {
    await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', session.id);
    res.status(500).json({ error: 'Failed to generate first question. Please try again.' });
  }
}

export async function listSessions(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)));
  const from = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ sessions: data, total: count });
}

export async function getSession(req: AuthRequest, res: Response) {
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();
  if (!session) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', req.params.id)
    .order('order_index');
  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', req.params.id);
  res.json({ session, questions, answers });
}

export async function endSession(req: AuthRequest, res: Response) {
  const { duration_seconds } = req.body;
  const { data: answers } = await supabase
    .from('answers')
    .select('score, question_id')
    .eq('session_id', req.params.id)
    .not('score', 'is', null);
  const typedAnswers = answers as { score: number | null; question_id: string | null }[] | null;
  const scores = (typedAnswers ?? []).map(a => a.score).filter((s): s is number => s !== null);
  const total_score = scores.length
    ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    : null;

  const { data: session, error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      total_score,
      duration_seconds,
      ended_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select()
    .single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  const highScoringIds = (typedAnswers ?? [])
    .filter(a => a.score !== null && a.score >= 7.0 && a.question_id)
    .map(a => a.question_id as string);
  if (highScoringIds.length > 0) {
    await supabase.from('questions').update({ is_template: true }).in('id', highScoringIds);
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const { data: todayPrev } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', req.userId)
    .eq('status', 'completed')
    .neq('id', req.params.id)
    .gte('ended_at', todayStart.toISOString())
    .limit(1);

  if (!todayPrev?.length) {
    const { data: yesterday } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', req.userId)
      .eq('status', 'completed')
      .gte('ended_at', yesterdayStart.toISOString())
      .lt('ended_at', todayStart.toISOString())
      .limit(1);

    const { data: prof } = await supabase
      .from('profiles')
      .select('streak_count')
      .eq('id', req.userId)
      .single();
    const newStreak = yesterday?.length ? (prof?.streak_count ?? 0) + 1 : 1;
    await supabase.from('profiles').update({ streak_count: newStreak }).eq('id', req.userId);
  }

  await upsertDailySnapshot(req.userId!);
  res.json({ session });
}

export async function deleteSession(req: AuthRequest, res: Response) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'abandoned' })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();
  if (error || !data) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.status(204).send();
}
