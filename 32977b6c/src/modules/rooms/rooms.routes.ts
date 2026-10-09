import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { createRoomSchema, updateRoomSchema, listRoomsQuerySchema, roomStatus } from './rooms.schema';
import * as service from './rooms.service';
import { upload } from '../../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = Router();
const statusBodySchema = z.object({ status: roomStatus });

router.use(authenticate);

router.get(
  '/',
  validate(listRoomsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listRooms(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getRoom(req.params.id);
    res.json({ success: true, data });
  })
);

router.use(requireRole('admin', 'manager'));

router.post(
  '/',
  validate(createRoomSchema),
  asyncHandler(async (req, res) => {
    const data = await service.createRoom(req.body);
    res.status(201).json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateRoomSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateRoom(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/image',
  validate(uuidParamSchema, 'params'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    const data = await service.updateRoomImage(req.params.id, url);
    res.json({ success: true, data, url });
  })
);

router.delete(
  '/:id/image',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const room = await service.getRoom(req.params.id);
    if (room.image_url) {
      const filePath = path.resolve(__dirname, '../../public', room.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    const data = await service.updateRoomImage(req.params.id, null);
    res.json({ success: true, data });
  })
);

router.patch(
  '/:id/status',
  validate(uuidParamSchema, 'params'),
  validate(statusBodySchema),
  asyncHandler(async (req, res) => {
    const data = await service.updateRoomStatus(req.params.id, req.body.status);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.deleteRoom(req.params.id);
    res.json({ success: true, message: 'Chambre supprimée' });
  })
);

export default router;
