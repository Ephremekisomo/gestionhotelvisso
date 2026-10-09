import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { ApiError } from '../../utils/ApiError';
import {
  createReservationSchema,
  updateReservationSchema,
  listReservationsQuerySchema,
  availabilityQuerySchema,
} from './reservations.schema';
import * as service from './reservations.service';

const router = Router();

router.use(authenticate);

router.get(
  '/availability',
  validate(availabilityQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const data = await service.checkAvailability(req.query as any);
    res.json({ success: true, data });
  })
);

router.get(
  '/',
  validate(listReservationsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listReservations(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/',
  validate(createReservationSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await service.createReservation(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getReservation(req.params.id);
    res.json({ success: true, data });
  })
);

router.get(
  '/:id/folio',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getFolio(req.params.id);
    res.json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateReservationSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateReservation(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/confirm',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.transitionStatus(req.params.id, 'confirm');
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/check-in',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.transitionStatus(req.params.id, 'check_in');
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/check-out',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.transitionStatus(req.params.id, 'check_out');
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/cancel',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.transitionStatus(req.params.id, 'cancel');
    res.json({ success: true, data });
  })
);

router.use(requireRole('admin', 'manager'));

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.deleteReservation(req.params.id);
    res.json({ success: true, message: 'Réservation supprimée' });
  })
);

export default router;
