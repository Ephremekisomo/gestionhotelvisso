import * as bcrypt from 'bcryptjs';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { signToken } from '../../middleware/auth';
import { LoginInput, RegisterInput } from './auth.schema';
import { UserRole } from '../../types';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}

function toPublicUser(row: UserRow) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    is_active: row.is_active,
  };
}

export async function login(input: LoginInput) {
  const user = (await db('users')
    .where({ email: input.email.toLowerCase() })
    .first()) as UserRow | undefined;

  if (!user) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }
  if (!user.is_active) {
    throw ApiError.forbidden('Ce compte est désactivé');
  }

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
  });

  return { token, user: toPublicUser(user) };
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existing = await db('users').where({ email }).first();
  if (existing) {
    throw ApiError.conflict('Un utilisateur avec cet email existe déjà');
  }

  const password_hash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
  const [row] = (await db('users')
    .insert({
      full_name: input.full_name,
      email,
      password_hash,
      role: input.role,
    })
    .returning('*')) as UserRow[];

  const token = signToken({
    sub: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
  });

  return { token, user: toPublicUser(row) };
}

export async function me(userId: string) {
  const user = (await db('users').where({ id: userId }).first()) as
    | UserRow
    | undefined;
  if (!user) throw ApiError.notFound('Utilisateur introuvable');
  return toPublicUser(user);
}
