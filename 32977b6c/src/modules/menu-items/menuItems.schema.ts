import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const menuCategory = z.enum(['starter', 'main', 'side', 'dessert', 'drink']);

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  category: menuCategory.default('main'),
  price: z.coerce.number().positive(),
  allergens: z.array(z.string().trim()).default([]),
  is_available: z.boolean().default(true),
  preparation_time_min: z.coerce.number().int().min(0).max(600).default(15),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const listMenuQuerySchema = paginationQuerySchema.extend({
  category: menuCategory.optional(),
  available_only: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const availabilitySchema = z.object({
  is_available: z.boolean(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ListMenuQuery = z.infer<typeof listMenuQuerySchema>;
