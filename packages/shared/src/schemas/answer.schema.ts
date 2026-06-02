import { z } from 'zod';

export const SubmitAnswerSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  text: z.string().min(1).max(5000),
});

export const EditAnswerSchema = z.object({
  text: z.string().min(1).max(5000),
});

export const AnswerFeedbackSchema = z.object({
  score: z.number().min(0).max(10),
  score_structure: z.number().min(0).max(10),
  score_technical: z.number().min(0).max(10),
  score_clarity: z.number().min(0).max(10),
  feedback_summary: z.string(),
  feedback_strengths: z.array(z.string()),
  feedback_weaknesses: z.array(z.string()),
  ai_recommendation: z.string(),
});
