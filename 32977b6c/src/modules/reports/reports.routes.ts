import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { getReport } from './reports.service';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };
    const data = await getReport({ from, to });
    res.json({ success: true, data });
  })
);

export default router;
