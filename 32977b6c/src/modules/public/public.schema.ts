import { z } from 'zod';
import { dateSchema } from '../../utils/commonSchemas';

export const reservationRequestSchema = z
  .object({
    full_name: z.string().trim().min(2).max(160),
    email: z.string().email('Email invalide'),
    phone: z.string().trim().max(40).optional().nullable(),
    room_id: z.string().uuid(),
    check_in: dateSchema,
    check_out: dateSchema,
    adults: z.coerce.number().int().min(1).max(20).default(1),
    children: z.coerce.number().int().min(0).max(20).default(0),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((d) => d.check_out > d.check_in, {
    message: 'La date de départ doit être après la date d\'arrivée',
    path: ['check_out'],
  });

export type ReservationRequestInput = z.infer<typeof reservationRequestSchema>;
