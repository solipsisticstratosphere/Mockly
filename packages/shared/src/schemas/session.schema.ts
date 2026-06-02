import { z } from 'zod';

export const SessionModeSchema = z.enum(['text', 'voice', 'rapid']);
export const TopicKeySchema = z.enum(['react', 'javascript', 'react_native', 'system_design', 'behavioral', 'mixed']);

export const CreateSessionSchema = z.object({
  mode: SessionModeSchema,
  topic: TopicKeySchema,
});

export const EndSessionSchema = z.object({
  duration_seconds: z.number().int().min(0),
});
