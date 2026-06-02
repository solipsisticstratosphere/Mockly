import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api';
import type { Profile, AnalyticsSummary, AnalyticsSnapshot, WeakTopic, Session, Question } from '@mockly/shared';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<{ profile: Profile }>('/api/auth/profile').then(r => r.profile),
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => apiGet<AnalyticsSummary>('/api/analytics/summary'),
  });
}

export function useAnalyticsHistory(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'history', days],
    queryFn: () =>
      apiGet<{ snapshots: AnalyticsSnapshot[] }>(`/api/analytics/history?days=${days}`).then(r => r.snapshots),
  });
}

export function useWeakTopics() {
  return useQuery({
    queryKey: ['analytics', 'weak-topics'],
    queryFn: () =>
      apiGet<{ topics: WeakTopic[] }>('/api/analytics/weak-topics').then(r => r.topics),
  });
}

export function useSessions(limit = 20) {
  return useQuery({
    queryKey: ['sessions', limit],
    queryFn: () =>
      apiGet<{ sessions: Session[]; total: number }>(`/api/sessions?limit=${limit}`).then(r => r.sessions),
  });
}

export interface QuestionBankFilters {
  topic?: string;
  role?: string;
  level?: string;
  page?: number;
  limit?: number;
}

export function useQuestionBank(filters: QuestionBankFilters = {}) {
  const { topic, role, level, page = 1, limit = 20 } = filters;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (topic && topic !== 'all') params.set('topic', topic);
  if (role) params.set('role', role);
  if (level) params.set('level', level);

  return useQuery({
    queryKey: ['question-bank', filters],
    queryFn: () =>
      apiGet<{ questions: Question[]; total: number }>(`/api/questions/bank?${params}`),
  });
}
