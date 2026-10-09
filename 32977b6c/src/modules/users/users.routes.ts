import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { ApiError } from '../../utils/ApiError';
import { createUserSchema, updateUserSchema, listUsersQuerySchema } from './users.schema';
import * as service from './users.service';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get(
  '/',
  validate(listUsersQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listUsers(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const data = await service.createUser(req.body);
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getUser(req.params.id);
    res.json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateUser(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await service.deleteUser(req.params.id, req.user.id);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  })
);

export default router;
