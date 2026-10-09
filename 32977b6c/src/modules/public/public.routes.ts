import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { reservationRequestSchema } from './public.schema';
import * as service from './public.service';

const router = Router();

router.get(
  '/rooms',
  asyncHandler(async (_req, res) => {
    const data = await service.listAvailableRooms();
    res.json({ success: true, data });
  })
);

router.post(
  '/reservation-requests',
  validate(reservationRequestSchema),
  asyncHandler(async (req, res) => {
    const data = await service.submitReservationRequest(req.body);
    res.status(201).json({ success: true, data });
  })
);

export default router;
