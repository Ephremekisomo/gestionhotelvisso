import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Utilisiers cuisine & serveur (idempotent)
  const kitchenHash = await bcrypt.hash('kitchen123', 10);
  const serverHash = await bcrypt.hash('server123', 10);
  const staff = [
    { full_name: 'Chef Cuisine', email: 'kitchen@hotel.com', password_hash: kitchenHash, role: 'kitchen' },
    { full_name: 'Serveur Étage', email: 'server@hotel.com', password_hash: serverHash, role: 'server' },
  ];
  for (const s of staff) {
    const exists = await knex('users').where({ email: s.email }).first();
    if (!exists) await knex('users').insert(s);
  }

  // Carte / menu
  await knex('menu_items').del();
  await knex('menu_items').insert([
    { name: 'Burger Maison', description: 'Bœuf, cheddar, salade, sauce maison', category: 'main', price: 18.5, allergens: JSON.stringify(['gluten', 'lait', 'œuf']), preparation_time_min: 20 },
    { name: 'Club Sandwich', description: 'Poulet, bacon, œuf, crudités', category: 'main', price: 15.0, allergens: JSON.stringify(['gluten', 'œuf']), preparation_time_min: 15 },
    { name: 'Salade César', description: 'Poulet grillé, parmesan, croûtons', category: 'starter', price: 12.0, allergens: JSON.stringify(['gluten', 'lait', 'poisson']), preparation_time_min: 10 },
    { name: 'Frites', description: 'Frites maison', category: 'side', price: 5.0, allergens: JSON.stringify([]), preparation_time_min: 8 },
    { name: 'Crème Brûlée', description: 'Dessert classique', category: 'dessert', price: 8.0, allergens: JSON.stringify(['lait', 'œuf']), preparation_time_min: 5 },
    { name: 'Soda', description: 'Cola, 33cl', category: 'drink', price: 4.0, allergens: JSON.stringify([]), preparation_time_min: 2 },
    { name: 'Eau Minérale', description: '50cl', category: 'drink', price: 3.0, allergens: JSON.stringify([]), preparation_time_min: 2 },
    { name: 'Café', description: 'Expresso', category: 'drink', price: 3.5, allergens: JSON.stringify([]), preparation_time_min: 3 },
  ]);

  console.log('Seed menu terminé. Cuisine: kitchen@hotel.com / kitchen123 — Serveur: server@hotel.com / server123');
}
