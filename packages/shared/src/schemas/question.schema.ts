import { z } from 'zod';
import { TopicKeySchema } from './session.schema';

export const NextQuestionSchema = z.object({
  session_id: z.string().uuid(),
  previous_answer_score: z.number().min(0).max(10).optional(),
});

export const FollowUpQuestionSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_text: z.string().min(1),
});

export const QuestionBankQuerySchema = z.object({
  topic: TopicKeySchema.optional(),
  role: z.string().optional(),
  level: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
