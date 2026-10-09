import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreateRoomInput, UpdateRoomInput, ListRoomsQuery } from './rooms.schema';

function baseQuery() {
  return db('rooms as r')
    .leftJoin('room_types as rt', 'rt.id', 'r.room_type_id')
    .select(
      'r.*',
      'rt.name as room_type_name',
      'rt.base_price as room_type_base_price',
      'rt.capacity as room_type_capacity'
    );
}

export async function listRooms(query: ListRoomsQuery) {
  let q = baseQuery().orderBy('r.room_number', 'asc');
  if (query.search) q = q.where('r.room_number', 'ilike', `%${query.search}%`);
  if (query.status) q = q.where('r.status', query.status);
  if (query.room_type_id) q = q.where('r.room_type_id', query.room_type_id);
  if (query.floor !== undefined) q = q.where('r.floor', query.floor);
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getRoom(id: string) {
  const row = await baseQuery().where('r.id', id).first();
  if (!row) throw ApiError.notFound('Chambre introuvable');
  return row;
}

export async function createRoom(input: CreateRoomInput) {
  const type = await db('room_types').where({ id: input.room_type_id }).first();
  if (!type) throw ApiError.badRequest('Type de chambre invalide');
  const [id] = await db('rooms').insert(input).returning('id');
  return getRoom(id.id);
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  await getRoom(id);
  if (input.room_type_id) {
    const type = await db('room_types').where({ id: input.room_type_id }).first();
    if (!type) throw ApiError.badRequest('Type de chambre invalide');
  }
  await db('rooms').where({ id }).update({ ...input, updated_at: db.fn.now() });
  return getRoom(id);
}

export async function updateRoomStatus(id: string, status: CreateRoomInput['status']) {
  await getRoom(id);
  await db('rooms').where({ id }).update({ status, updated_at: db.fn.now() });
  return getRoom(id);
}

export async function updateRoomImage(id: string, imageUrl: string | null) {
  await getRoom(id);
  await db('rooms').where({ id }).update({ image_url: imageUrl, updated_at: db.fn.now() });
  return getRoom(id);
}

export async function deleteRoom(id: string) {
  await getRoom(id);
  const active = await db('reservations')
    .where({ room_id: id })
    .whereIn('status', ['pending', 'confirmed', 'checked_in'])
    .first();
  if (active) {
    throw ApiError.conflict('Impossible: la chambre a des réservations actives');
  }
  await db('rooms').where({ id }).del();
}
