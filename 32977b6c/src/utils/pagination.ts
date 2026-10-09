import { Knex } from 'knex';

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T = any>(
  query: Knex.QueryBuilder,
  { page, limit }: PaginationParams
): Promise<PaginatedResult<T>> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * safeLimit;

  const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' });
  const [countRow] = await countQuery;
  const total = parseInt(String((countRow as any).count), 10);

  const data = await query.clone().limit(safeLimit).offset(offset);

  return {
    data: data as T[],
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export const paginationSchemaDefaults = {
  page: 1,
  limit: 20,
};
