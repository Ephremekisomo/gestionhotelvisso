import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/commonSchemas';

export const paymentMethod = z.enum(['cash', 'card', 'transfer', 'other']);
export const paymentStatus = z.enum(['pending', 'paid', 'refunded', 'failed']);

export const createPaymentSchema = z.object({
  reservation_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: paymentMethod.default('cash'),
  status: paymentStatus.default('paid'),
  reference: z.string().trim().max(120).optional().nullable(),
});

export const updatePaymentSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  method: paymentMethod.optional(),
  status: paymentStatus.optional(),
  reference: z.string().trim().max(120).optional().nullable(),
});

export const listPaymentsQuerySchema = paginationQuerySchema.extend({
  reservation_id: z.string().uuid().optional(),
  status: paymentStatus.optional(),
  method: paymentMethod.optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
