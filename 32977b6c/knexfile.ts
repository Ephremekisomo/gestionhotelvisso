import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/hotel';

const sslConfig = databaseUrl.includes('neon.tech')
  ? { ssl: { rejectUnauthorized: false } }
  : {};

const baseConfig: Partial<Knex.Config> = {
  client: 'pg',
  connection: {
    connectionString: databaseUrl,
    ...sslConfig,
  },
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    tableName: 'knex_migrations',
    extension: 'ts',
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
    extension: 'ts',
  },
};

const config: Record<string, Knex.Config> = {
  development: baseConfig as Knex.Config,
  production: baseConfig as Knex.Config,
};

export default config;
module.exports = config;
