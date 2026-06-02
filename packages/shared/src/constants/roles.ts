import type { UserRole, DifficultyLevel } from '../types';

export const ROLES: { key: UserRole; label: string }[] = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'react_native', label: 'React Native' },
  { key: 'general', label: 'General' },
];

export const LEVELS: { key: DifficultyLevel; label: string }[] = [
  { key: 'junior', label: 'Junior' },
  { key: 'middle', label: 'Middle' },
  { key: 'senior', label: 'Senior' },
];
