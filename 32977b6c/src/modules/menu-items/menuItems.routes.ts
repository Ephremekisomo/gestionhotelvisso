import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  listMenuQuerySchema,
  availabilitySchema,
} from './menuItems.schema';
import * as service from './menuItems.service';

const router = Router();

router.use(authenticate);

// Lecture de la carte : tout utilisateur authentifié
router.get(
  '/',
  validate(listMenuQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listMenuItems(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getMenuItem(req.params.id);
    res.json({ success: true, data });
  })
);

// Gestion de la carte : cuisine + managers/admin
router.use(requireRole('admin', 'manager', 'kitchen'));

router.post(
  '/',
  validate(createMenuItemSchema),
  asyncHandler(async (req, res) => {
    const data = await service.createMenuItem(req.body);
    res.status(201).json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateMenuItemSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateMenuItem(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

// Rupture de stock : masque/affiche temporairement un plat
router.patch(
  '/:id/availability',
  validate(uuidParamSchema, 'params'),
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
    const data = await service.setAvailability(req.params.id, req.body.is_available);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.deleteMenuItem(req.params.id);
    res.json({ success: true, message: 'Article supprimé' });
  })
);

export default router;
