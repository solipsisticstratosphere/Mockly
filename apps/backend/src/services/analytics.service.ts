import { supabase } from '../config/supabase';

export function calcReadinessScore(params: {
  avgScoreLast7: number;
  streakCount: number;
  sessionsLast30: number;
}): number {
  const perf = (params.avgScoreLast7 / 10) * 60;
  const consistency = (Math.min(params.streakCount, 30) / 30) * 20;
  const volume = (Math.min(params.sessionsLast30, 20) / 20) * 20;
  return Math.min(100, Math.round((perf + consistency + volume) * 100) / 100);
}

export async function upsertDailySnapshot(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: sessions } = await supabase
    .from('sessions')
    .select('total_score, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (!sessions?.length) return;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last7 = sessions.filter(s => s.created_at >= sevenDaysAgo);
  const avgScoreLast7 = last7.length
    ? last7.reduce((s, r) => s + (r.total_score ?? 0), 0) / last7.length
    : 0;

  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sessionsLast30 = sessions.filter(s => s.created_at >= thirtyAgo).length;

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count')
    .eq('id', userId)
    .single();
  const streakCount = profile?.streak_count ?? 0;

  const readiness_score = calcReadinessScore({ avgScoreLast7, streakCount, sessionsLast30 });

  const { data: answers } = await supabase
    .from('answers')
    .select('session_id, score, questions(topic)')
    .eq('user_id', userId)
    .not('score', 'is', null);

  const topicScores: Record<string, number[]> = {};
  const typedAnswers = answers as
    | { score: number | null; questions: { topic: string } | null }[]
    | null;
  (typedAnswers ?? []).forEach(a => {
    const topic = a.questions?.topic;
    if (topic && a.score != null) {
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(a.score);
    }
  });
  const weak_topics = Object.entries(topicScores)
    .map(([t, scores]) => ({ t, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .filter(x => x.avg < 5)
    .map(x => x.t);

  await supabase.from('analytics_snapshots').upsert(
    {
      user_id: userId,
      snapshot_date: today,
      avg_score: avgScoreLast7,
      sessions_count: sessions.length,
      questions_count: (answers ?? []).length,
      readiness_score,
      weak_topics,
    },
    { onConflict: 'user_id,snapshot_date' },
  );
}
