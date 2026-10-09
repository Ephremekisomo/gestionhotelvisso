import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const createUserSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'manager', 'receptionist', 'kitchen', 'server']).default('receptionist'),
  is_active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'manager', 'receptionist', 'kitchen', 'server']).optional(),
  is_active: z.boolean().optional(),
});

export const listUsersQuerySchema = paginationQuerySchema;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
