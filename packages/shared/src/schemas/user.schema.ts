import { z } from 'zod';

export const UserRoleSchema = z.enum(['frontend', 'backend', 'react_native', 'general']);
export const DifficultyLevelSchema = z.enum(['junior', 'middle', 'senior']);

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  role: UserRoleSchema.optional(),
  level: DifficultyLevelSchema.optional(),
  expo_push_token: z.string().optional(),
});

export const CreateProfileSchema = z.object({
  full_name: z.string().min(1).max(100),
  role: UserRoleSchema,
  level: DifficultyLevelSchema,
});
