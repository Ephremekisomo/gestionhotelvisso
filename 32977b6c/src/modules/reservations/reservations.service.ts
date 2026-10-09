import { Knex } from 'knex';
import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import {
  CreateReservationInput,
  UpdateReservationInput,
  ListReservationsQuery,
  AvailabilityQuery,
} from './reservations.schema';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked_in'];

type Db = Knex | Knex.Transaction;

function baseQuery(client: Db = db) {
  return client('reservations as res')
    .leftJoin('guests as g', 'g.id', 'res.guest_id')
    .leftJoin('rooms as r', 'r.id', 'res.room_id')
    .leftJoin('room_types as rt', 'rt.id', 'r.room_type_id')
    .leftJoin('users as u', 'u.id', 'res.created_by')
    .select(
      'res.*',
      'g.full_name as guest_name',
      'g.email as guest_email',
      'g.phone as guest_phone',
      'r.room_number',
      'r.floor',
      'rt.name as room_type_name',
      'u.full_name as created_by_name'
    );
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

async function generateReservationNumber(trx: Knex.Transaction): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const num = `RES-${Date.now().toString().slice(-8)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const exists = await trx('reservations').where({ reservation_number: num }).first();
    if (!exists) return num;
  }
  return `RES-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function assertRoomAvailable(
  trx: Knex.Transaction,
  roomId: string,
  checkIn: string,
  checkOut: string,
  ignoreReservationId?: string
): Promise<void> {
  let q = trx('reservations')
    .where({ room_id: roomId })
    .whereIn('status', ACTIVE_STATUSES)
    .where('check_in', '<', checkOut)
    .where('check_out', '>', checkIn);
  if (ignoreReservationId) {
    q = q.whereNot({ id: ignoreReservationId });
  }
  const conflict = await q.first();
  if (conflict) {
    throw ApiError.conflict('La chambre n\'est pas disponible sur cette période');
  }
}

async function computePrice(trx: Knex.Transaction, roomId: string, nights: number) {
  const room = await trx('rooms as r')
    .leftJoin('room_types as rt', 'rt.id', 'r.room_type_id')
    .where('r.id', roomId)
    .select('r.price_override', 'rt.base_price', 'rt.capacity')
    .first();
  if (!room) throw ApiError.badRequest('Chambre invalide');
  const unitPrice = room.price_override != null ? Number(room.price_override) : Number(room.base_price);
  return { total: Number((unitPrice * nights).toFixed(2)), unitPrice, capacity: room.capacity };
}

export async function listReservations(query: ListReservationsQuery) {
  let q = baseQuery().orderBy('res.created_at', 'desc');
  if (query.search) {
    q = q.where(function () {
      this.where('res.reservation_number', 'ilike', `%${query.search}%`)
        .orWhere('g.full_name', 'ilike', `%${query.search}%`);
    });
  }
  if (query.status) q = q.where('res.status', query.status);
  if (query.guest_id) q = q.where('res.guest_id', query.guest_id);
  if (query.room_id) q = q.where('res.room_id', query.room_id);
  if (query.from) q = q.where('res.check_out', '>=', query.from);
  if (query.to) q = q.where('res.check_in', '<=', query.to);
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getReservation(id: string, client: Db = db) {
  const row = await baseQuery(client).where('res.id', id).first();
  if (!row) throw ApiError.notFound('Réservation introuvable');
  return row;
}

export async function createReservation(input: CreateReservationInput, userId?: string) {
  const nights = nightsBetween(input.check_in, input.check_out);
  if (nights <= 0) throw ApiError.badRequest('Séjour invalide');

  return db.transaction(async (trx) => {
    const guest = await trx('guests').where({ id: input.guest_id }).first();
    if (!guest) throw ApiError.badRequest('Client invalide');

    const room = await trx('rooms').where({ id: input.room_id }).first();
    if (!room) throw ApiError.badRequest('Chambre invalide');

    await assertRoomAvailable(trx, input.room_id, input.check_in, input.check_out);

    const { total, capacity } = await computePrice(trx, input.room_id, nights);
    if (input.adults + input.children > capacity) {
      throw ApiError.badRequest(`Capacité max de la chambre: ${capacity} personnes`);
    }

    const reservation_number = await generateReservationNumber(trx);
    const [id] = await trx('reservations')
      .insert({
        reservation_number,
        guest_id: input.guest_id,
        room_id: input.room_id,
        check_in: input.check_in,
        check_out: input.check_out,
        adults: input.adults,
        children: input.children,
        status: 'pending',
        total_price: total,
        notes: input.notes ?? null,
        created_by: userId ?? null,
      })
      .returning('id');

    return getReservation(id.id, trx);
  });
}

export async function updateReservation(id: string, input: UpdateReservationInput) {
  return db.transaction(async (trx) => {
    const existing = await trx('reservations').where({ id }).first();
    if (!existing) throw ApiError.notFound('Réservation introuvable');
    if (['checked_out', 'cancelled'].includes(existing.status)) {
      throw ApiError.badRequest('Réservation déjà clôturée, non modifiable');
    }

    const merged = { ...existing, ...input };
    const nights = nightsBetween(merged.check_in, merged.check_out);
    if (nights <= 0) throw ApiError.badRequest('Séjour invalide');

    await assertRoomAvailable(trx, merged.room_id, merged.check_in, merged.check_out, id);

    const { total, capacity } = await computePrice(trx, merged.room_id, nights);
    if (merged.adults + merged.children > capacity) {
      throw ApiError.badRequest(`Capacité max de la chambre: ${capacity} personnes`);
    }

    await trx('reservations').where({ id }).update({
      guest_id: merged.guest_id,
      room_id: merged.room_id,
      check_in: merged.check_in,
      check_out: merged.check_out,
      adults: merged.adults,
      children: merged.children,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      total_price: total,
      updated_at: trx.fn.now(),
    });

    return getReservation(id, trx);
  });
}

export async function transitionStatus(id: string, action: 'confirm' | 'check_in' | 'check_out' | 'cancel') {
  return db.transaction(async (trx) => {
    const res = await trx('reservations').where({ id }).first();
    if (!res) throw ApiError.notFound('Réservation introuvable');

    const allowed: Record<string, string[]> = {
      confirm: ['pending', 'confirmed'],
      check_in: ['confirmed', 'pending'],
      check_out: ['checked_in'],
      cancel: ['pending', 'confirmed'],
    };
    if (!allowed[action].includes(res.status)) {
      throw ApiError.badRequest(
        `Transition '${action}' impossible depuis le statut '${res.status}'`
      );
    }

    if (action === 'confirm') {
      await trx('reservations').where({ id }).update({ status: 'confirmed', updated_at: trx.fn.now() });
    } else if (action === 'check_in') {
      await trx('reservations').where({ id }).update({ status: 'checked_in', updated_at: trx.fn.now() });
      await trx('rooms').where({ id: res.room_id }).update({ status: 'occupied', updated_at: trx.fn.now() });
    } else if (action === 'check_out') {
      await trx('reservations').where({ id }).update({ status: 'checked_out', updated_at: trx.fn.now() });
      await trx('rooms').where({ id: res.room_id }).update({ status: 'cleaning', updated_at: trx.fn.now() });
    } else if (action === 'cancel') {
      await trx('reservations').where({ id }).update({ status: 'cancelled', updated_at: trx.fn.now() });
    }

    return getReservation(id, trx);
  });
}

export async function deleteReservation(id: string) {
  const res = await db('reservations').where({ id }).first();
  if (!res) throw ApiError.notFound('Réservation introuvable');
  await db('reservations').where({ id }).del();
}

export async function checkAvailability(query: AvailabilityQuery) {
  const { check_in, check_out, room_id } = query;
  let roomsQuery = db('rooms as r')
    .leftJoin('room_types as rt', 'rt.id', 'r.room_type_id')
    .select('r.id', 'r.room_number', 'r.floor', 'r.status', 'rt.name as room_type_name', 'rt.base_price', 'r.price_override');

  if (room_id) roomsQuery = roomsQuery.where('r.id', room_id);
  const rooms = await roomsQuery;

  const conflicts = await db('reservations')
    .whereIn('status', ACTIVE_STATUSES)
    .where('check_in', '<', check_out)
    .where('check_out', '>', check_in)
    .select('room_id');
  const busyRoomIds = new Set(conflicts.map((c: any) => c.room_id));

  const available = rooms
    .filter((r: any) => !busyRoomIds.has(r.id) && r.status !== 'maintenance')
    .map((r: any) => ({
      id: r.id,
      room_number: r.room_number,
      floor: r.floor,
      status: r.status,
      room_type_name: r.room_type_name,
      unit_price: r.price_override != null ? Number(r.price_override) : Number(r.base_price),
    }));

  return { check_in, check_out, count: available.length, rooms: available };
}

// Note globale de la chambre : séjour + charges (room service, minibar...) - paiements
export async function getFolio(reservationId: string) {
  const reservation = await baseQuery().where('res.id', reservationId).first();
  if (!reservation) throw ApiError.notFound('Réservation introuvable');

  const charges = await db('room_charges as c')
    .leftJoin('users as u', 'u.id', 'c.created_by')
    .where('c.reservation_id', reservationId)
    .select('c.*', 'u.full_name as created_by_name')
    .orderBy('c.created_at', 'asc');

  const payments = await db('payments')
    .where({ reservation_id: reservationId })
    .select('*')
    .orderBy('created_at', 'asc');

  const foodOrders = await db('food_orders')
    .where({ reservation_id: reservationId })
    .select('id', 'order_number', 'status', 'subtotal', 'charged', 'created_at')
    .orderBy('created_at', 'asc');

  const room_total = Number(reservation.total_price);
  const charges_total = charges.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const paid_total = payments
    .filter((p: any) => p.status === 'paid')
    .reduce((s: number, p: any) => s + Number(p.amount), 0);

  const grand_total = Number((room_total + charges_total).toFixed(2));

  return {
    reservation: {
      id: reservation.id,
      reservation_number: reservation.reservation_number,
      status: reservation.status,
      room_number: reservation.room_number,
      guest_name: reservation.guest_name,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
    },
    room_total,
    charges,
    charges_total: Number(charges_total.toFixed(2)),
    food_orders: foodOrders,
    payments,
    paid_total: Number(paid_total.toFixed(2)),
    grand_total,
    balance: Number((grand_total - paid_total).toFixed(2)),
    is_settled: paid_total >= grand_total && grand_total > 0,
  };
}
