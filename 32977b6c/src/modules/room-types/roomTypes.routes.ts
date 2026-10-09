import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { createRoomTypeSchema, updateRoomTypeSchema, listRoomTypesQuerySchema } from './roomTypes.schema';
import * as service from './roomTypes.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listRoomTypesQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listRoomTypes(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getRoomType(req.params.id);
    res.json({ success: true, data });
  })
);

router.use(requireRole('admin', 'manager'));

router.post(
  '/',
  validate(createRoomTypeSchema),
  asyncHandler(async (req, res) => {
    const data = await service.createRoomType(req.body);
    res.status(201).json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateRoomTypeSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateRoomType(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.deleteRoomType(req.params.id);
    res.json({ success: true, message: 'Type de chambre supprimé' });
  })
);

export default router;
