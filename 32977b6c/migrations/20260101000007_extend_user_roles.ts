import { Knex } from 'knex';

const NEW_ROLES = ['admin', 'manager', 'receptionist', 'kitchen', 'server'];

export async function up(knex: Knex): Promise<void> {
  // Supprime dynamiquement la contrainte CHECK existante sur users.role
  const constraints: any = await knex.raw(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  `);
  const rows = constraints.rows ?? constraints;
  for (const row of rows) {
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${row.conname}"`);
  }

  const list = NEW_ROLES.map((r) => `'${r}'`).join(', ');
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (${list}))`
  );
}

export async function down(knex: Knex): Promise<void> {
  // Repasse les rôles kitchen/server en receptionist avant de restreindre
  await knex('users').whereIn('role', ['kitchen', 'server']).update({ role: 'receptionist' });

  const constraints: any = await knex.raw(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  `);
  const rows = constraints.rows ?? constraints;
  for (const row of rows) {
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${row.conname}"`);
  }
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'receptionist'))`
  );
}
