import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { createPaymentSchema, updatePaymentSchema, listPaymentsQuerySchema } from './payments.schema';
import * as service from './payments.service';

const router = Router();

router.use(authenticate);

router.get(
  '/reservation/:reservationId/balance',
  asyncHandler(async (req, res) => {
    const data = await service.reservationBalance(req.params.reservationId);
    res.json({ success: true, data });
  })
);

router.get(
  '/',
  validate(listPaymentsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listPayments(req.query as any);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/',
  validate(createPaymentSchema),
  asyncHandler(async (req, res) => {
    const data = await service.createPayment(req.body);
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getPayment(req.params.id);
    res.json({ success: true, data });
  })
);

router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updatePaymentSchema),
  asyncHandler(async (req, res) => {
    const data = await service.updatePayment(req.params.id, req.body);
    res.json({ success: true, data });
  })
);

router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.deletePayment(req.params.id);
    res.json({ success: true, message: 'Paiement supprimé' });
  })
);

export default router;
