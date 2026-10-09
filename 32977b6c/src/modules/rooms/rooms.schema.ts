import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const roomStatus = z.enum(['available', 'occupied', 'cleaning', 'maintenance']);

export const createRoomSchema = z.object({
  room_number: z.string().trim().min(1).max(20),
  room_type_id: z.string().uuid(),
  floor: z.coerce.number().int().min(0).max(200).default(1),
  status: roomStatus.default('available'),
  price_override: z.coerce.number().nonnegative().optional().nullable(),
  image_url: z.string().trim().optional().nullable(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const listRoomsQuerySchema = paginationQuerySchema.extend({
  status: roomStatus.optional(),
  room_type_id: z.string().uuid().optional(),
  floor: z.coerce.number().int().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
