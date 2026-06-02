export type UserRole = 'frontend' | 'backend' | 'react_native' | 'general';
export type DifficultyLevel = 'junior' | 'middle' | 'senior';
export type SessionMode = 'text' | 'voice' | 'rapid';
export type QuestionCategory = 'technical' | 'behavioral' | 'system_design';
export type TopicKey = 'react' | 'javascript' | 'react_native' | 'system_design' | 'behavioral' | 'mixed';
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  level: DifficultyLevel;
  streak_count: number;
  last_active: string | null;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  mode: SessionMode;
  topic: TopicKey;
  role: UserRole;
  level: DifficultyLevel;
  status: SessionStatus;
  total_score: number | null;
  readiness_delta: number | null;
  question_count: number;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  session_id: string | null;
  topic: TopicKey;
  category: QuestionCategory;
  role: UserRole;
  level: DifficultyLevel;
  text: string;
  follow_up_of: string | null;
  is_template: boolean;
  order_index: number | null;
  created_at: string;
  key_concepts?: string[];
  estimated_answer_minutes?: number;
}

export interface AnswerFeedback {
  score: number;
  score_structure: number;
  score_technical: number;
  score_clarity: number;
  feedback_summary: string;
  feedback_strengths: string[];
  feedback_weaknesses: string[];
  ai_recommendation: string;
}

export interface Answer {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  text: string | null;
  audio_url: string | null;
  transcript: string | null;
  score: number | null;
  score_structure: number | null;
  score_technical: number | null;
  score_clarity: number | null;
  feedback_summary: string | null;
  feedback_strengths: string[] | null;
  feedback_weaknesses: string[] | null;
  ai_recommendation: string | null;
  skipped: boolean;
  time_taken_seconds: number | null;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  avg_score: number | null;
  sessions_count: number;
  questions_count: number;
  readiness_score: number | null;
  weak_topics: string[] | null;
}

export interface AnalyticsSummary {
  readiness_score: number;
  avg_score: number;
  streak: number;
  sessions_count: number;
}

export interface WeakTopic {
  name: string;
  avg_score: number;
  count: number;
}
