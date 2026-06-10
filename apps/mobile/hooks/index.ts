import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type {
  Profile,
  AnalyticsSummary,
  AnalyticsSnapshot,
  WeakTopic,
  Session,
  Question,
} from '@mockly/shared';

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
      apiGet<{ snapshots: AnalyticsSnapshot[] }>(`/api/analytics/history?days=${days}`).then(
        r => r.snapshots,
      ),
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
      apiGet<{ sessions: Session[]; total: number }>(`/api/sessions?limit=${limit}`).then(
        r => r.sessions,
      ),
  });
}

const SESSION_PAGE_SIZE = 20;

export function useSessionsInfinite() {
  return useInfiniteQuery({
    queryKey: ['sessions', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<{ sessions: Session[]; total: number }>(
        `/api/sessions?page=${pageParam}&limit=${SESSION_PAGE_SIZE}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * SESSION_PAGE_SIZE;
      return fetched < (lastPage.total ?? 0) ? allPages.length + 1 : undefined;
    },
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
