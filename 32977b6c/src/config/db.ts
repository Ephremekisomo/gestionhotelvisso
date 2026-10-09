import knex, { Knex } from 'knex';
import { env } from './env';

const sslConfig = env.databaseUrl.includes('neon.tech')
  ? { ssl: { rejectUnauthorized: false } }
  : {};

const config: Knex.Config = {
  client: 'pg',
  connection: {
    connectionString: env.databaseUrl,
    ...sslConfig,
  },
  pool: { min: 0, max: 10 },
  migrations: {
    directory: __dirname + '/../../migrations',
    extension: 'ts',
  },
  seeds: {
    directory: __dirname + '/../../seeds',
    extension: 'ts',
  },
};

export const db = knex(config);

export async function assertDatabaseConnection(): Promise<void> {
  await db.raw('select 1');
}
