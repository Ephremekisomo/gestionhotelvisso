import { db } from '../../config/db';

export async function getDashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const roomsRow: any = await db('rooms')
    .count({ total: '*' })
    .select(db.raw("count(*) filter (where status = 'available') as available"))
    .select(db.raw("count(*) filter (where status = 'occupied') as occupied"))
    .select(db.raw("count(*) filter (where status = 'cleaning') as cleaning"))
    .select(db.raw("count(*) filter (where status = 'maintenance') as maintenance"))
    .first();

  const activeRes: any = await db('reservations')
    .whereIn('status', ['pending', 'confirmed', 'checked_in'])
    .count({ total: '*' })
    .first();

  const arrivals = await db('reservations as res')
    .join('guests as g', 'g.id', 'res.guest_id')
    .where('res.check_in', today)
    .whereIn('res.status', ['pending', 'confirmed'])
    .select('res.id', 'res.reservation_number', 'res.check_in', 'g.full_name as guest_name')
    .orderBy('res.created_at', 'asc')
    .limit(10);

  const departures = await db('reservations as res')
    .join('guests as g', 'g.id', 'res.guest_id')
    .where('res.check_out', today)
    .whereIn('res.status', ['checked_in', 'confirmed'])
    .select('res.id', 'res.reservation_number', 'res.check_out', 'g.full_name as guest_name')
    .orderBy('res.created_at', 'asc')
    .limit(10);

  const [revenueRow] = await db('payments')
    .where({ status: 'paid' })
    .sum({ total: 'amount' });

  const [guestsRow] = await db('guests').count({ total: '*' });

  const totalRooms = Number(roomsRow.total);
  const occupied = Number(roomsRow.occupied);

  return {
    date: today,
    rooms: {
      total: totalRooms,
      available: Number(roomsRow.available),
      occupied,
      cleaning: Number(roomsRow.cleaning),
      maintenance: Number(roomsRow.maintenance),
      occupancy_rate: totalRooms ? Number(((occupied / totalRooms) * 100).toFixed(1)) : 0,
    },
    reservations: { active: Number(activeRes.total) },
    guests: { total: Number(guestsRow.total) },
    revenue: { total_paid: Number(revenueRow?.total ?? 0) },
    today: { arrivals, departures },
  };
}
