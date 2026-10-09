import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreateGuestInput, UpdateGuestInput, ListGuestsQuery } from './guests.schema';

export async function listGuests(query: ListGuestsQuery) {
  let q = db('guests').select('*').orderBy('created_at', 'desc');
  if (query.search) {
    const s = `%${query.search}%`;
    q = q.where(function () {
      this.where('full_name', 'ilike', s)
        .orWhere('email', 'ilike', s)
        .orWhere('phone', 'ilike', s);
    });
  }
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getGuest(id: string) {
  const row = await db('guests').where({ id }).first();
  if (!row) throw ApiError.notFound('Client introuvable');
  return row;
}

export async function createGuest(input: CreateGuestInput) {
  const [row] = await db('guests').insert(input).returning('*');
  return row;
}

export async function updateGuest(id: string, input: UpdateGuestInput) {
  await getGuest(id);
  const [row] = await db('guests')
    .where({ id })
    .update({ ...input, updated_at: db.fn.now() })
    .returning('*');
  return row;
}

export async function deleteGuest(id: string) {
  await getGuest(id);
  const reservation = await db('reservations').where({ guest_id: id }).first();
  if (reservation) {
    throw ApiError.conflict('Impossible: ce client a des réservations');
  }
  await db('guests').where({ id }).del();
}
