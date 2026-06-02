import type { TopicKey } from '../types';

export const TOPICS: { key: TopicKey; label: string; icon: string }[] = [
  { key: 'react', label: 'React', icon: 'code' },
  { key: 'javascript', label: 'JavaScript', icon: 'zap' },
  { key: 'react_native', label: 'React Native', icon: 'layers' },
  { key: 'system_design', label: 'System Design', icon: 'target' },
  { key: 'behavioral', label: 'Behavioral', icon: 'message' },
  { key: 'mixed', label: 'Mixed', icon: 'sparkle' },
];

export const SESSION_MODES = [
  { key: 'text' as const, label: 'Text', icon: 'message', desc: 'Type your answers at your own pace', meta: '8 questions · ~15 min' },
  { key: 'voice' as const, label: 'Voice', icon: 'mic', desc: 'Speak answers aloud, AI transcribes', meta: '6 questions · ~20 min' },
  { key: 'rapid' as const, label: 'Rapid Drill', icon: 'zap', desc: 'Fast-fire concepts, short answers', meta: '12 questions · ~7 min' },
];
