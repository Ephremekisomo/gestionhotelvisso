import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { upload } from '../../middleware/upload';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url } });
  })
);

export default router;
