import { db } from '../../config/db';
import { Knex } from 'knex';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreatePaymentInput, UpdatePaymentInput, ListPaymentsQuery } from './payments.schema';

type Db = Knex | Knex.Transaction;

function baseQuery(client: Db = db) {
  return client('payments as p')
    .leftJoin('reservations as r', 'r.id', 'p.reservation_id')
    .select('p.*', 'r.reservation_number', 'r.total_price');
}

export async function listPayments(query: ListPaymentsQuery) {
  let q = baseQuery().orderBy('p.created_at', 'desc');
  if (query.reservation_id) q = q.where('p.reservation_id', query.reservation_id);
  if (query.status) q = q.where('p.status', query.status);
  if (query.method) q = q.where('p.method', query.method);
  if (query.search) q = q.where('r.reservation_number', 'ilike', `%${query.search}%`);
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getPayment(id: string, client: Db = db) {
  const row = await baseQuery(client).where('p.id', id).first();
  if (!row) throw ApiError.notFound('Paiement introuvable');
  return row;
}

export async function createPayment(input: CreatePaymentInput) {
  const reservation = await db('reservations').where({ id: input.reservation_id }).first();
  if (!reservation) throw ApiError.badRequest('Réservation invalide');
  if (reservation.status === 'cancelled') {
    throw ApiError.badRequest('Impossible de payer une réservation annulée');
  }

  return db.transaction(async (trx) => {
    const paidSoFar = await trx('payments')
      .where({ reservation_id: input.reservation_id, status: 'paid' })
      .sum({ total: 'amount' })
      .first();
    const alreadyPaid = Number((paidSoFar as any)?.total ?? 0);
    if (input.status === 'paid' && alreadyPaid + input.amount > Number(reservation.total_price)) {
      throw ApiError.badRequest(
        `Le paiement dépasse le montant dû (reste: ${(Number(reservation.total_price) - alreadyPaid).toFixed(2)})`
      );
    }

    const [id] = await trx('payments')
      .insert({
        reservation_id: input.reservation_id,
        amount: input.amount,
        method: input.method,
        status: input.status,
        reference: input.reference ?? null,
        paid_at: input.status === 'paid' ? trx.fn.now() : null,
      })
      .returning('id');

    return getPayment(id.id, trx);
  });
}

export async function updatePayment(id: string, input: UpdatePaymentInput) {
  const existing = await db('payments').where({ id }).first();
  if (!existing) throw ApiError.notFound('Paiement introuvable');

  const patch: Record<string, unknown> = { ...input, updated_at: db.fn.now() };
  if (input.status === 'paid' && existing.status !== 'paid') {
    patch.paid_at = db.fn.now();
  }
  await db('payments').where({ id }).update(patch);
  return getPayment(id);
}

export async function deletePayment(id: string) {
  const existing = await db('payments').where({ id }).first();
  if (!existing) throw ApiError.notFound('Paiement introuvable');
  await db('payments').where({ id }).del();
}

export async function reservationBalance(reservationId: string) {
  const reservation = await db('reservations').where({ id: reservationId }).first();
  if (!reservation) throw ApiError.notFound('Réservation introuvable');

  const rows = await db('payments')
    .where({ reservation_id: reservationId })
    .select('status')
    .sum({ total: 'amount' })
    .groupBy('status');

  const byStatus: Record<string, number> = {};
  for (const r of rows as any[]) byStatus[r.status] = Number(r.total);

  const total_price = Number(reservation.total_price);
  const paid = byStatus['paid'] ?? 0;
  return {
    reservation_id: reservationId,
    reservation_number: reservation.reservation_number,
    total_price,
    paid,
    refunded: byStatus['refunded'] ?? 0,
    pending: byStatus['pending'] ?? 0,
    balance: Number((total_price - paid).toFixed(2)),
    is_fully_paid: paid >= total_price && total_price > 0,
  };
}
