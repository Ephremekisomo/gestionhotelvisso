import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { uuidParamSchema } from '../../utils/commonSchemas';
import { ApiError } from '../../utils/ApiError';
import { createOrderSchema, listOrdersQuerySchema } from './foodOrders.schema';
import * as service from './foodOrders.service';

const router = Router();
const uid = (req: any) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

router.use(authenticate);

// Files d'attente (écrans cuisine / serveur)
router.get(
  '/queue/kitchen',
  requireRole('admin', 'manager', 'kitchen'),
  asyncHandler(async (_req, res) => {
    const data = await service.kitchenQueue();
    res.json({ success: true, data });
  })
);

router.get(
  '/queue/delivery',
  requireRole('admin', 'manager', 'server'),
  asyncHandler(async (_req, res) => {
    const data = await service.deliveryQueue();
    res.json({ success: true, data });
  })
);

router.get(
  '/',
  validate(listOrdersQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await service.listOrders(req.query as any);
    res.json({ success: true, ...result });
  })
);

// Passer une commande (client via app chambre, ou réception pour le client)
router.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const data = await service.placeOrder(req.body, uid(req));
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.getOrder(req.params.id);
    res.json({ success: true, data });
  })
);

// Cuisine : lance la préparation (bloque l'annulation client)
router.post(
  '/:id/accept',
  requireRole('admin', 'manager', 'kitchen'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.acceptOrder(req.params.id, uid(req));
    res.json({ success: true, data });
  })
);

// Cuisine : plat prêt -> alerte le serveur
router.post(
  '/:id/ready',
  requireRole('admin', 'manager', 'kitchen'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.markReady(req.params.id, uid(req));
    res.json({ success: true, data });
  })
);

// Serveur : prend en charge la livraison
router.post(
  '/:id/deliver-start',
  requireRole('admin', 'manager', 'server'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.startDelivery(req.params.id, uid(req));
    res.json({ success: true, data });
  })
);

// Serveur : confirme la livraison -> impute sur la note de la chambre
router.post(
  '/:id/deliver',
  requireRole('admin', 'manager', 'server'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.deliverOrder(req.params.id, uid(req));
    res.json({ success: true, data });
  })
);

// Annulation : possible uniquement tant que la cuisine n'a pas validé (statut 'pending')
router.post(
  '/:id/cancel',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const data = await service.cancelOrder(req.params.id, uid(req));
    res.json({ success: true, data });
  })
);

export default router;
