import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reservation_id')
      .notNullable()
      .references('id')
      .inTable('reservations')
      .onDelete('CASCADE');
    table.decimal('amount', 12, 2).notNullable();
    table
      .enum('method', ['cash', 'card', 'transfer', 'other'])
      .notNullable()
      .defaultTo('cash');
    table
      .enum('status', ['pending', 'paid', 'refunded', 'failed'])
      .notNullable()
      .defaultTo('pending');
    table.string('reference', 120);
    table.timestamp('paid_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['reservation_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
}
