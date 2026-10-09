import * as bcrypt from 'bcryptjs';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';

const publicCols = ['id', 'full_name', 'email', 'role', 'is_active', 'created_at', 'updated_at'];

export async function listUsers(query: ListUsersQuery) {
  let q = db('users').select(...publicCols).orderBy('created_at', 'desc');
  if (query.search) {
    const s = `%${query.search}%`;
    q = q.where(function () {
      this.where('full_name', 'ilike', s).orWhere('email', 'ilike', s);
    });
  }
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getUser(id: string) {
  const row = await db('users').select(...publicCols).where({ id }).first();
  if (!row) throw ApiError.notFound('Utilisateur introuvable');
  return row;
}

export async function createUser(input: CreateUserInput) {
  const email = input.email.toLowerCase();
  const exists = await db('users').where({ email }).first();
  if (exists) throw ApiError.conflict('Email déjà utilisé');
  const password_hash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
  const [row] = await db('users')
    .insert({ full_name: input.full_name, email, password_hash, role: input.role, is_active: input.is_active })
    .returning(publicCols);
  return row;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await getUser(id);
  const payload: Record<string, unknown> = { ...input, updated_at: db.fn.now() };
  if (input.email) payload.email = input.email.toLowerCase();
  if (input.password) {
    payload.password_hash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    delete payload.password;
  }
  const [row] = await db('users').where({ id }).update(payload).returning(publicCols);
  return row;
}

export async function deleteUser(id: string, currentUserId: string) {
  await getUser(id);
  if (id === currentUserId) {
    throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
  }
  await db('users').where({ id }).del();
}
