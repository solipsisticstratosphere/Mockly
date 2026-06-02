import { create } from 'zustand';
import type { SessionMode, TopicKey, Question } from '@mockly/shared';

interface SessionState {
  activeSessionId: string | null;
  mode: SessionMode | null;
  topic: TopicKey | null;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  isRecording: boolean;
  timerSeconds: number;
  setSession: (id: string, mode: SessionMode, topic: TopicKey, total: number) => void;
  setCurrentQuestion: (q: Question) => void;
  setRecording: (v: boolean) => void;
  tickTimer: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  mode: null,
  topic: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 8,
  isRecording: false,
  timerSeconds: 0,

  setSession: (id, mode, topic, total) =>
    set({ activeSessionId: id, mode, topic, totalQuestions: total, questionIndex: 0, timerSeconds: 0 }),

  setCurrentQuestion: (q) =>
    set((s) => ({ currentQuestion: q, questionIndex: s.questionIndex + 1 })),

  setRecording: (isRecording) => set({ isRecording }),
  tickTimer: () => set((s) => ({ timerSeconds: s.timerSeconds + 1 })),

  resetSession: () => set({
    activeSessionId: null, mode: null, topic: null, currentQuestion: null,
    questionIndex: 0, totalQuestions: 8, isRecording: false, timerSeconds: 0,
  }),
}));
