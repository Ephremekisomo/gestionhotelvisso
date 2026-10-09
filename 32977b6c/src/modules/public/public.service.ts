import { db } from '../../config/db';
import { createReservation } from '../reservations/reservations.service';
import { ReservationRequestInput } from './public.schema';

// Chambres disponibles publiques (pour le formulaire de réservation du site)
export async function listAvailableRooms() {
  const rooms = await db('rooms as r')
    .leftJoin('room_types as rt', 'rt.id', 'r.room_type_id')
    .where('r.status', 'available')
    .select(
      'r.id',
      'r.room_number',
      'r.floor',
      'r.image_url',
      'rt.name as room_type_name',
      'rt.description as room_type_description',
      'rt.capacity',
      db.raw('COALESCE(r.price_override, rt.base_price) as price')
    )
    .orderBy('r.room_number', 'asc');
  return rooms;
}

// Demande de réservation publique : crée/retouve le client puis une réservation 'pending'
export async function submitReservationRequest(input: ReservationRequestInput) {
  const email = input.email.toLowerCase();

  let guest = await db('guests').where({ email }).first();
  if (!guest) {
    const [created] = await db('guests')
      .insert({
        full_name: input.full_name,
        email,
        phone: input.phone ?? null,
      })
      .returning('*');
    guest = created;
  }

  const reservation = await createReservation(
    {
      guest_id: guest.id,
      room_id: input.room_id,
      check_in: input.check_in,
      check_out: input.check_out,
      adults: input.adults,
      children: input.children,
      notes: input.notes ?? null,
    },
    undefined // pas d'utilisateur connecté : demande publique
  );

  return {
    reservation_number: reservation.reservation_number,
    status: reservation.status,
    total_price: reservation.total_price,
    check_in: reservation.check_in,
    check_out: reservation.check_out,
    room_number: reservation.room_number,
    message:
      'Votre demande de réservation a bien été enregistrée. Notre équipe vous contactera pour confirmation.',
  };
}
