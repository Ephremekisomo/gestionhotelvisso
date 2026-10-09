import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('menu_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 120).notNullable();
    table.text('description');
    table
      .enum('category', ['starter', 'main', 'side', 'dessert', 'drink'])
      .notNullable()
      .defaultTo('main');
    table.decimal('price', 12, 2).notNullable();
    table.jsonb('allergens').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.boolean('is_available').notNullable().defaultTo(true);
    table.integer('preparation_time_min').notNullable().defaultTo(15);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['category']);
    table.index(['is_available']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('menu_items');
}
