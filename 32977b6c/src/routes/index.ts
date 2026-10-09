import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import guestsRoutes from '../modules/guests/guests.routes';
import roomTypesRoutes from '../modules/room-types/roomTypes.routes';
import roomsRoutes from '../modules/rooms/rooms.routes';
import reservationsRoutes from '../modules/reservations/reservations.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import menuItemsRoutes from '../modules/menu-items/menuItems.routes';
import foodOrdersRoutes from '../modules/food-orders/foodOrders.routes';
import publicRoutes from '../modules/public/public.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import uploadRoutes from '../modules/upload/upload.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API de gestion d\'hôtel',
    version: '1.0.0',
    endpoints: [
      'POST /api/v1/auth/login',
      'GET  /api/v1/dashboard',
      'GET  /api/v1/reports?from=YYYY-MM-DD&to=YYYY-MM-DD (admin/manager)',
      'CRUD /api/v1/users',
      'CRUD /api/v1/guests',
      'CRUD /api/v1/room-types',
      'CRUD /api/v1/rooms (+ POST /:id/image, DELETE /:id)',
      'POST /api/v1/upload (upload d\'image)',
      'CRUD /api/v1/reservations (+ /availability, /:id/confirm|check-in|check-out|cancel, /:id/folio)',
      'CRUD /api/v1/payments (+ /reservation/:id/balance)',
      'CRUD /api/v1/menu-items (+ /:id/availability)',
      'CRUD /api/v1/food-orders (+ /queue/kitchen, /queue/delivery, /:id/accept|ready|deliver-start|deliver|cancel)',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/users', usersRoutes);
router.use('/guests', guestsRoutes);
router.use('/room-types', roomTypesRoutes);
router.use('/rooms', roomsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/menu-items', menuItemsRoutes);
router.use('/food-orders', foodOrdersRoutes);
router.use('/public', publicRoutes);
router.use('/upload', uploadRoutes);

export default router;
