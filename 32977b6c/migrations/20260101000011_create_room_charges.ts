import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('room_charges', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reservation_id')
      .notNullable()
      .references('id')
      .inTable('reservations')
      .onDelete('CASCADE');
    table
      .uuid('room_id')
      .notNullable()
      .references('id')
      .inTable('rooms')
      .onDelete('RESTRICT');
    table.string('label', 160).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table
      .enum('source', ['room_service', 'minibar', 'laundry', 'parking', 'other'])
      .notNullable()
      .defaultTo('other');
    table.uuid('reference_id');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['reservation_id']);
    table.index(['room_id']);
    table.index(['source']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('room_charges');
}
