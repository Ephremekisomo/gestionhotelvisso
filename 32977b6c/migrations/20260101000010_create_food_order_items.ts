import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('food_order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('food_order_id')
      .notNullable()
      .references('id')
      .inTable('food_orders')
      .onDelete('CASCADE');
    table
      .uuid('menu_item_id')
      .references('id')
      .inTable('menu_items')
      .onDelete('SET NULL');
    table.string('name', 120).notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('line_total', 12, 2).notNullable();
    table.string('options', 255);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['food_order_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('food_order_items');
}
