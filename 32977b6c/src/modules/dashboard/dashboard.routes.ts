import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { getDashboard } from './dashboard.service';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (_req, res) => {
    const data = await getDashboard();
    res.json({ success: true, data });
  })
);

export default router;
