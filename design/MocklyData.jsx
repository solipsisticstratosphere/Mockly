/* global window */
// Mockly — shared mock data. Consistent across all screens.

const MOCK = {
  profile: {
    name: 'Alex Rivera',
    initials: 'AR',
    email: 'alex.rivera@gmail.com',
    role: 'Frontend',
    roleKey: 'frontend',
    level: 'Middle',
    streak: 12,
    readiness: 74,
    readinessDelta: +6,
    avgScore: 7.4,
    sessionsTotal: 38,
    questionsTotal: 214,
    bestStreak: 21,
  },

  // Readiness trend — last 8 sessions (score 0–10)
  trend: [5.8, 6.2, 6.0, 6.9, 7.1, 6.8, 7.6, 7.4],

  // Topic mastery (avg score 0–10)
  topics: [
    { key: 'react', name: 'React', score: 8.1, count: 42, icon: 'code' },
    { key: 'javascript', name: 'JavaScript', score: 7.6, count: 38, icon: 'zap' },
    { key: 'react_native', name: 'React Native', score: 6.4, count: 24, icon: 'layers' },
    { key: 'system_design', name: 'System Design', score: 4.8, count: 18, icon: 'target' },
    { key: 'behavioral', name: 'Behavioral', score: 5.6, count: 22, icon: 'message' },
  ],

  // Recent sessions
  sessions: [
    { id: 's1', topic: 'React', mode: 'text', score: 7.8, questions: 8, date: 'Today · 9:14 AM', when: 'today', duration: '14 min' },
    { id: 's2', topic: 'System Design', mode: 'voice', score: 4.9, questions: 6, date: 'Yesterday · 7:40 PM', when: 'yesterday', duration: '22 min' },
    { id: 's3', topic: 'Behavioral', mode: 'text', score: 6.2, questions: 5, date: 'Yesterday · 8:05 AM', when: 'yesterday', duration: '11 min' },
    { id: 's4', topic: 'JavaScript', mode: 'rapid', score: 8.4, questions: 12, date: 'Mon, May 30', when: 'earlier', duration: '7 min' },
    { id: 's5', topic: 'React Native', mode: 'text', score: 6.6, questions: 8, date: 'Sun, May 29', when: 'earlier', duration: '16 min' },
    { id: 's6', topic: 'Mixed', mode: 'voice', score: 7.1, questions: 10, date: 'Sat, May 28', when: 'earlier', duration: '19 min' },
  ],

  modes: [
    { key: 'text', name: 'Text', icon: 'message', desc: 'Type your answers at your own pace', meta: '8 questions · ~15 min' },
    { key: 'voice', name: 'Voice', icon: 'mic', desc: 'Speak answers aloud, AI transcribes', meta: '6 questions · ~20 min' },
    { key: 'rapid', name: 'Rapid Drill', icon: 'zap', desc: 'Fast-fire concepts, short answers', meta: '12 questions · ~7 min' },
  ],

  topicOptions: [
    { key: 'react', name: 'React' },
    { key: 'javascript', name: 'JavaScript' },
    { key: 'react_native', name: 'React Native' },
    { key: 'system_design', name: 'System Design' },
    { key: 'behavioral', name: 'Behavioral' },
    { key: 'mixed', name: 'Mixed' },
  ],

  // Scripted interview questions (with model feedback for the prototype)
  questions: {
    react: [
      {
        category: 'technical',
        text: 'Explain the difference between `useMemo` and `useCallback`. When would reaching for either actually hurt performance?',
        concepts: ['memoization', 'referential equality', 'render cost'],
        minutes: 3,
      },
      {
        category: 'technical',
        text: 'A list re-renders every keystroke in an unrelated input. Walk me through how you would diagnose and fix it.',
        concepts: ['React.memo', 'context splitting', 'profiler'],
        minutes: 4,
      },
      {
        category: 'technical',
        text: 'What problem do React keys solve, and what breaks when you use the array index as a key?',
        concepts: ['reconciliation', 'list identity', 'state preservation'],
        minutes: 2,
      },
    ],
  },

  // Default feedback shown after a submitted answer (prototype)
  sampleFeedback: {
    score: 7.6,
    score_structure: 8.0,
    score_technical: 7.5,
    score_clarity: 7.3,
    summary: 'Solid grasp of the core distinction and you correctly tied both hooks to referential stability. The example was concrete, but you skipped the cost of memoization itself.',
    strengths: [
      'Clearly separated value memoization from function memoization',
      'Used a real dependency-array example to ground the answer',
    ],
    weaknesses: [
      'Did not mention that memoization has its own comparison cost',
      'Missed when premature memoization can hurt readability',
    ],
    recommendation: 'Next time, name one case where adding useMemo makes things slower — it shows senior-level judgement.',
  },
};

window.MOCK = MOCK;
