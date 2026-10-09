import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreateRoomTypeInput, UpdateRoomTypeInput, ListRoomTypesQuery } from './roomTypes.schema';

export async function listRoomTypes(query: ListRoomTypesQuery) {
  let q = db('room_types').select('*').orderBy('name', 'asc');
  if (query.search) {
    q = q.where('name', 'ilike', `%${query.search}%`);
  }
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getRoomType(id: string) {
  const row = await db('room_types').where({ id }).first();
  if (!row) throw ApiError.notFound('Type de chambre introuvable');
  return row;
}

export async function createRoomType(input: CreateRoomTypeInput) {
  const [row] = await db('room_types').insert(input).returning('*');
  return row;
}

export async function updateRoomType(id: string, input: UpdateRoomTypeInput) {
  await getRoomType(id);
  const [row] = await db('room_types')
    .where({ id })
    .update({ ...input, updated_at: db.fn.now() })
    .returning('*');
  return row;
}

export async function deleteRoomType(id: string) {
  await getRoomType(id);
  const room = await db('rooms').where({ room_type_id: id }).first();
  if (room) {
    throw ApiError.conflict('Impossible: des chambres utilisent ce type');
  }
  await db('room_types').where({ id }).del();
}
