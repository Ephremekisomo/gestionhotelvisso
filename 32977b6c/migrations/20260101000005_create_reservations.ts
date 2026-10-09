import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reservations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('reservation_number', 30).notNullable().unique();
    table
      .uuid('guest_id')
      .notNullable()
      .references('id')
      .inTable('guests')
      .onDelete('RESTRICT');
    table
      .uuid('room_id')
      .notNullable()
      .references('id')
      .inTable('rooms')
      .onDelete('RESTRICT');
    table.date('check_in').notNullable();
    table.date('check_out').notNullable();
    table.integer('adults').notNullable().defaultTo(1);
    table.integer('children').notNullable().defaultTo(0);
    table
      .enum('status', [
        'pending',
        'confirmed',
        'checked_in',
        'checked_out',
        'cancelled',
      ])
      .notNullable()
      .defaultTo('pending');
    table.decimal('total_price', 12, 2).notNullable().defaultTo(0);
    table.text('notes');
    table
      .uuid('created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['guest_id']);
    table.index(['room_id']);
    table.index(['status']);
    table.index(['check_in', 'check_out']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reservations');
}
