import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const createRoomTypeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional().nullable(),
  base_price: z.coerce.number().nonnegative(),
  capacity: z.coerce.number().int().min(1).max(20),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();
export const listRoomTypesQuerySchema = paginationQuerySchema;

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
export type ListRoomTypesQuery = z.infer<typeof listRoomTypesQuerySchema>;
