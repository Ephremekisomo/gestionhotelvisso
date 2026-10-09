import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreateMenuItemInput, UpdateMenuItemInput, ListMenuQuery } from './menuItems.schema';

export async function listMenuItems(query: ListMenuQuery) {
  let q = db('menu_items').select('*').orderBy('category', 'asc').orderBy('name', 'asc');
  if (query.search) {
    q = q.where(function () {
      this.where('name', 'ilike', `%${query.search}%`).orWhere(
        'description',
        'ilike',
        `%${query.search}%`
      );
    });
  }
  if (query.category) q = q.where('category', query.category);
  if (query.available_only !== undefined) q = q.where('is_available', query.available_only);
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getMenuItem(id: string) {
  const row = await db('menu_items').where({ id }).first();
  if (!row) throw ApiError.notFound('Article du menu introuvable');
  return row;
}

export async function createMenuItem(input: CreateMenuItemInput) {
  const [row] = await db('menu_items')
    .insert({ ...input, allergens: JSON.stringify(input.allergens ?? []) })
    .returning('*');
  return row;
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput) {
  await getMenuItem(id);
  const payload: Record<string, unknown> = { ...input, updated_at: db.fn.now() };
  if (input.allergens) payload.allergens = JSON.stringify(input.allergens);
  const [row] = await db('menu_items').where({ id }).update(payload).returning('*');
  return row;
}

export async function setAvailability(id: string, is_available: boolean) {
  await getMenuItem(id);
  const [row] = await db('menu_items')
    .where({ id })
    .update({ is_available, updated_at: db.fn.now() })
    .returning('*');
  return row;
}

export async function deleteMenuItem(id: string) {
  await getMenuItem(id);
  await db('menu_items').where({ id }).del();
}
