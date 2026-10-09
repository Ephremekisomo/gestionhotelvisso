import { z } from 'zod';
import { paginationQuerySchema, dateSchema } from '../../utils/commonSchemas';

export const reservationStatus = z.enum([
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
]);

export const createReservationSchema = z
  .object({
    guest_id: z.string().uuid(),
    room_id: z.string().uuid(),
    check_in: dateSchema,
    check_out: dateSchema,
    adults: z.coerce.number().int().min(1).max(20).default(1),
    children: z.coerce.number().int().min(0).max(20).default(0),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((d) => d.check_out > d.check_in, {
    message: 'La date de départ doit être après la date d\'arrivée',
    path: ['check_out'],
  });

export const updateReservationSchema = z
  .object({
    guest_id: z.string().uuid().optional(),
    room_id: z.string().uuid().optional(),
    check_in: dateSchema.optional(),
    check_out: dateSchema.optional(),
    adults: z.coerce.number().int().min(1).max(20).optional(),
    children: z.coerce.number().int().min(0).max(20).optional(),
    notes: z.string().trim().optional().nullable(),
  });

export const listReservationsQuerySchema = paginationQuerySchema.extend({
  status: reservationStatus.optional(),
  guest_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const availabilityQuerySchema = z.object({
  room_id: z.string().uuid().optional(),
  check_in: dateSchema,
  check_out: dateSchema,
}).refine((d) => d.check_out > d.check_in, {
  message: 'check_out doit être après check_in',
  path: ['check_out'],
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
