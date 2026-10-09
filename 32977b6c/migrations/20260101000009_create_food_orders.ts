import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('food_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('order_number', 30).notNullable().unique();
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
    table
      .uuid('guest_id')
      .references('id')
      .inTable('guests')
      .onDelete('SET NULL');
    table
      .enum('status', [
        'pending',
        'preparing',
        'ready',
        'delivering',
        'delivered',
        'cancelled',
      ])
      .notNullable()
      .defaultTo('pending');
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    table.text('notes');
    table.boolean('charged').notNullable().defaultTo(false);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('prepared_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('delivered_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('accepted_at');
    table.timestamp('ready_at');
    table.timestamp('delivered_at');
    table.timestamp('cancelled_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['reservation_id']);
    table.index(['room_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('food_orders');
}
