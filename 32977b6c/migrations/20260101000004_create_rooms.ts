import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('rooms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('room_number', 20).notNullable().unique();
    table
      .uuid('room_type_id')
      .notNullable()
      .references('id')
      .inTable('room_types')
      .onDelete('RESTRICT');
    table.integer('floor').notNullable().defaultTo(1);
    table
      .enum('status', ['available', 'occupied', 'cleaning', 'maintenance'])
      .notNullable()
      .defaultTo('available');
    table.decimal('price_override', 12, 2);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['room_type_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('rooms');
}
