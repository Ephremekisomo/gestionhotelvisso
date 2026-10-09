import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function inPeriod(q: any, from: string, endExclusive: string) {
  return q.where('created_at', '>=', from).where('created_at', '<', endExclusive);
}

export interface ReportQuery {
  from?: string;
  to?: string;
}

export async function getReport(query: ReportQuery) {
  const from = query.from && DATE_RE.test(query.from) ? query.from : startOfMonth();
  const to = query.to && DATE_RE.test(query.to) ? query.to : today();
  if (from > to) {
    throw ApiError.badRequest('La date de début doit être antérieure ou égale à la date de fin');
  }
  const end = addDays(to, 1); // borne exclusive

  // --- Réservations créées sur la période ---
  const resAgg: any = await inPeriod(db('reservations'), from, end)
    .whereNot('status', 'cancelled')
    .select(db.raw('COUNT(*)::int as total'))
    .select(db.raw('COALESCE(SUM(total_price), 0) as room_revenue'))
    .select(db.raw('COALESCE(SUM(check_out - check_in), 0)::int as nights'))
    .first();

  const resByStatus = await inPeriod(db('reservations'), from, end)
    .select('status')
    .select(db.raw('COUNT(*)::int as count'))
    .select(db.raw('COALESCE(SUM(total_price), 0) as total'))
    .groupBy('status')
    .orderBy('count', 'desc');

  // --- Encaissements (paiements payés) sur la période ---
  const payAgg: any = await inPeriod(db('payments'), from, end)
    .where('status', 'paid')
    .select(db.raw('COUNT(*)::int as count'))
    .select(db.raw('COALESCE(SUM(amount), 0) as total'))
    .first();

  const paymentsByMethod = await inPeriod(db('payments'), from, end)
    .where('status', 'paid')
    .select('method')
    .select(db.raw('COUNT(*)::int as count'))
    .select(db.raw('COALESCE(SUM(amount), 0) as total'))
    .groupBy('method')
    .orderBy('total', 'desc');

  // --- Charges chambre (room service, minibar, ...) sur la période ---
  const chargesAgg: any = await inPeriod(db('room_charges'), from, end)
    .select(db.raw('COUNT(*)::int as count'))
    .select(db.raw('COALESCE(SUM(amount), 0) as total'))
    .first();

  const chargesBySource = await inPeriod(db('room_charges'), from, end)
    .select('source')
    .select(db.raw('COUNT(*)::int as count'))
    .select(db.raw('COALESCE(SUM(amount), 0) as total'))
    .groupBy('source')
    .orderBy('total', 'desc');

  // --- Room service (commandes) sur la période ---
  const ordersAgg: any = await inPeriod(db('food_orders'), from, end)
    .select(db.raw('COUNT(*)::int as count'))
    .select(db.raw("COALESCE(SUM(subtotal) FILTER (WHERE status = 'delivered'), 0) as revenue"))
    .first();

  const ordersByStatus = await inPeriod(db('food_orders'), from, end)
    .select('status')
    .select(db.raw('COUNT(*)::int as count'))
    .groupBy('status')
    .orderBy('count', 'desc');

  // --- Clients ---
  const newGuests: any = await inPeriod(db('guests'), from, end)
    .select(db.raw('COUNT(*)::int as count'))
    .first();
  const totalGuests: any = await db('guests').select(db.raw('COUNT(*)::int as count')).first();

  // --- Occupation (instantané actuel) ---
  const roomsRow: any = await db('rooms')
    .select(db.raw('COUNT(*)::int as total'))
    .select(db.raw("COUNT(*) FILTER (WHERE status = 'available')::int as available"))
    .select(db.raw("COUNT(*) FILTER (WHERE status = 'occupied')::int as occupied"))
    .select(db.raw("COUNT(*) FILTER (WHERE status = 'cleaning')::int as cleaning"))
    .select(db.raw("COUNT(*) FILTER (WHERE status = 'maintenance')::int as maintenance"))
    .first();

  const totalRooms = Number(roomsRow.total);
  const occupied = Number(roomsRow.occupied);

  const paidTotal = Number(payAgg.total);
  const chargesTotal = Number(chargesAgg.total);
  const roomRevenue = Number(resAgg.room_revenue);

  return {
    period: { from, to },
    generated_at: new Date().toISOString(),
    rooms: {
      total: totalRooms,
      available: Number(roomsRow.available),
      occupied,
      cleaning: Number(roomsRow.cleaning),
      maintenance: Number(roomsRow.maintenance),
      occupancy_rate: totalRooms ? Number(((occupied / totalRooms) * 100).toFixed(1)) : 0,
    },
    reservations: {
      total: Number(resAgg.total),
      nights: Number(resAgg.nights),
      room_revenue: roomRevenue,
      by_status: resByStatus.map((r: any) => ({
        status: r.status,
        count: Number(r.count),
        total: Number(r.total),
      })),
    },
    revenue: {
      paid_total: paidTotal,
      payments_count: Number(payAgg.count),
      charges_total: chargesTotal,
      charges_count: Number(chargesAgg.count),
      room_service_revenue: Number(ordersAgg.revenue),
      payments_by_method: paymentsByMethod.map((r: any) => ({
        method: r.method,
        count: Number(r.count),
        total: Number(r.total),
      })),
      charges_by_source: chargesBySource.map((r: any) => ({
        source: r.source,
        count: Number(r.count),
        total: Number(r.total),
      })),
    },
    food_orders: {
      total: Number(ordersAgg.count),
      revenue: Number(ordersAgg.revenue),
      by_status: ordersByStatus.map((r: any) => ({ status: r.status, count: Number(r.count) })),
    },
    guests: {
      new: Number(newGuests.count),
      total: Number(totalGuests.count),
    },
  };
}
