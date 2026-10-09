import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Identifiant invalide'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu YYYY-MM-DD)');
