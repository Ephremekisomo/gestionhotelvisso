import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const createGuestSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  id_document: z.string().trim().max(80).optional().nullable(),
  nationality: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateGuestSchema = createGuestSchema.partial();
export const listGuestsQuerySchema = paginationQuerySchema;

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ListGuestsQuery = z.infer<typeof listGuestsQuerySchema>;
