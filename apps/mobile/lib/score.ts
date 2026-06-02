import { Colors } from '../constants/colors';

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return Colors.n70;
  if (score >= 7.5) return Colors.green;
  if (score >= 5) return Colors.amber;
  return Colors.red;
}

export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 8.5) return 'Excellent';
  if (score >= 7)   return 'Strong';
  if (score >= 5)   return 'Developing';
  if (score >= 3)   return 'Needs work';
  return 'Weak';
}
