import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { createGuestSchema, updateGuestSchema, listGuestsQuerySchema } from './guests.schema';
import * as service from './guests.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listGuestsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listGuests(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/',
  validate(createGuestSchema),
  asyncHandler(async (req, res) => {
    const data = await service.createGuest(req.body);
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getGuest(req.params.id);
    res.json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateGuestSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateGuest(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.deleteGuest(req.params.id);
    res.json({ success: true, message: 'Client supprimé' });
  })
);

export default router;
