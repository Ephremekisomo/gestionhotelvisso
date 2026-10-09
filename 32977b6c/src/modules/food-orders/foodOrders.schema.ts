import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const foodOrderStatus = z.enum([
  'pending',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
]);

export const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  options: z.string().trim().max(255).optional().nullable(),
});

export const createOrderSchema = z.object({
  room_id: z.string().uuid(),
  items: z.array(orderItemSchema).min(1, 'La commande doit contenir au moins un article'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: foodOrderStatus.optional(),
  room_id: z.string().uuid().optional(),
  reservation_id: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
