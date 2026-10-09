import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Nettoyage complet dans l'ordre des dépendances (FK) pour être ré-exécutable
  for (const table of [
    'food_order_items',
    'food_orders',
    'room_charges',
    'payments',
    'reservations',
    'rooms',
    'room_types',
    'guests',
    'users',
  ]) {
    await knex(table).del();
  }

  // Utilisateurs
  const adminHash = await bcrypt.hash('admin123', 10);
  const receptionHash = await bcrypt.hash('reception123', 10);
  const [admin] = await knex('users')
    .insert([
      {
        full_name: 'Administrateur Hôtel',
        email: 'admin@hotel.com',
        password_hash: adminHash,
        role: 'admin',
      },
      {
        full_name: 'Réception Principale',
        email: 'reception@hotel.com',
        password_hash: receptionHash,
        role: 'receptionist',
      },
    ])
    .returning('id');

  // Types de chambres
  await knex('room_types').del();
  const types = await knex('room_types')
    .insert([
      { name: 'Standard', description: 'Chambre simple, 1 lit', base_price: 80, capacity: 1 },
      { name: 'Double', description: 'Chambre double, 2 lits', base_price: 120, capacity: 2 },
      { name: 'Deluxe', description: 'Chambre deluxe avec vue', base_price: 200, capacity: 3 },
      { name: 'Suite', description: 'Suite présidentielle', base_price: 400, capacity: 4 },
    ])
    .returning(['id', 'name']);

  const typeByName = Object.fromEntries(types.map((t) => [t.name, t.id]));

  // Chambres
  await knex('rooms').del();
  const rooms: any[] = [];
  const plan: Array<[string, string, number]> = [
    ['101', 'Standard', 1],
    ['102', 'Standard', 1],
    ['103', 'Double', 1],
    ['201', 'Double', 2],
    ['202', 'Deluxe', 2],
    ['203', 'Deluxe', 2],
    ['301', 'Suite', 3],
    ['302', 'Suite', 3],
  ];
  for (const [num, typeName, floor] of plan) {
    rooms.push({
      room_number: num,
      room_type_id: typeByName[typeName],
      floor,
      status: 'available',
    });
  }
  await knex('rooms').insert(rooms);

  // Un client d'exemple
  await knex('guests').del();
  await knex('guests').insert([
    {
      full_name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      phone: '+33600000000',
      address: '12 rue de la Paix, Paris',
      id_document: 'ID12345678',
      nationality: 'Française',
    },
  ]);

  console.log('Seed terminé. Admin: admin@hotel.com / admin123');
  void admin;
}
