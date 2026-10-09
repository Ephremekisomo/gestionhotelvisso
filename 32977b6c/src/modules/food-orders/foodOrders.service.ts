import { Knex } from 'knex';
import { db } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { paginate } from '../../utils/pagination';
import { CreateOrderInput, ListOrdersQuery } from './foodOrders.schema';

type Db = Knex | Knex.Transaction;

const TRANSITIONS: Record<string, { to: string; guard?: string[] }> = {
  accept: { to: 'preparing', guard: ['pending'] },
  ready: { to: 'ready', guard: ['preparing'] },
  start_delivery: { to: 'delivering', guard: ['ready'] },
  deliver: { to: 'delivered', guard: ['delivering'] },
  cancel: { to: 'cancelled', guard: ['pending'] },
};

function baseQuery(client: Db = db) {
  return client('food_orders as o')
    .leftJoin('rooms as r', 'r.id', 'o.room_id')
    .leftJoin('guests as g', 'g.id', 'o.guest_id')
    .leftJoin('reservations as res', 'res.id', 'o.reservation_id')
    .select(
      'o.*',
      'r.room_number',
      'g.full_name as guest_name',
      'res.reservation_number'
    );
}

async function generateOrderNumber(trx: Knex.Transaction): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const num = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await trx('food_orders').where({ order_number: num }).first();
    if (!exists) return num;
  }
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function listOrders(query: ListOrdersQuery) {
  let q = baseQuery().orderBy('o.created_at', 'desc');
  if (query.status) q = q.where('o.status', query.status);
  if (query.room_id) q = q.where('o.room_id', query.room_id);
  if (query.reservation_id) q = q.where('o.reservation_id', query.reservation_id);
  if (query.search) q = q.where('o.order_number', 'ilike', `%${query.search}%`);
  return paginate(q, { page: query.page, limit: query.limit });
}

export async function getOrder(id: string, client: Db = db) {
  const order = await baseQuery(client).where('o.id', id).first();
  if (!order) throw ApiError.notFound('Commande introuvable');
  const items = await client('food_order_items').where({ food_order_id: id });
  return { ...order, items };
}

// File d'attente cuisine : nouvelles commandes + en préparation
export async function kitchenQueue() {
  const orders = await baseQuery()
    .whereIn('o.status', ['pending', 'preparing'])
    .orderBy('o.created_at', 'asc');
  const withItems = await Promise.all(orders.map((o: any) => getOrder(o.id)));
  return withItems;
}

// File d'attente livraison : prêtes + en cours de livraison
export async function deliveryQueue() {
  const orders = await baseQuery()
    .whereIn('o.status', ['ready', 'delivering'])
    .orderBy('o.ready_at', 'asc');
  const withItems = await Promise.all(orders.map((o: any) => getOrder(o.id)));
  return withItems;
}

export async function placeOrder(input: CreateOrderInput, userId?: string) {
  return db.transaction(async (trx) => {
    // La chambre doit être occupée (client présent) => réservation en checked_in
    const reservation = await trx('reservations')
      .where({ room_id: input.room_id, status: 'checked_in' })
      .orderBy('created_at', 'desc')
      .first();
    if (!reservation) {
      throw ApiError.badRequest('La chambre n\'est pas occupée (aucun client enregistré)');
    }

    // Résolution des articles + vérif disponibilité
    const menuIds = input.items.map((i) => i.menu_item_id);
    const menuItems = await trx('menu_items').whereIn('id', menuIds);
    const menuById = new Map(menuItems.map((m: any) => [m.id, m]));

    const lineItems: any[] = [];
    let subtotal = 0;
    for (const item of input.items) {
      const menu = menuById.get(item.menu_item_id) as any;
      if (!menu) throw ApiError.badRequest(`Article de menu invalide: ${item.menu_item_id}`);
      if (!menu.is_available) {
        throw ApiError.conflict(`Article en rupture de stock: ${menu.name}`);
      }
      const unit_price = Number(menu.price);
      const line_total = Number((unit_price * item.quantity).toFixed(2));
      subtotal += line_total;
      lineItems.push({
        menu_item_id: menu.id,
        name: menu.name,
        unit_price,
        quantity: item.quantity,
        line_total,
        options: item.options ?? null,
      });
    }
    subtotal = Number(subtotal.toFixed(2));

    const order_number = await generateOrderNumber(trx);
    const [orderId] = await trx('food_orders')
      .insert({
        order_number,
        reservation_id: reservation.id,
        room_id: input.room_id,
        guest_id: reservation.guest_id,
        status: 'pending',
        subtotal,
        notes: input.notes ?? null,
        created_by: userId ?? null,
      })
      .returning('id');

    await trx('food_order_items').insert(
      lineItems.map((li) => ({ ...li, food_order_id: orderId.id }))
    );

    return getOrder(orderId.id, trx);
  });
}

async function transition(
  id: string,
  action: keyof typeof TRANSITIONS,
  userId?: string
) {
  const { to, guard } = TRANSITIONS[action];
  return db.transaction(async (trx) => {
    const order = await trx('food_orders').where({ id }).first();
    if (!order) throw ApiError.notFound('Commande introuvable');
    if (guard && !guard.includes(order.status)) {
      throw ApiError.badRequest(
        `Action '${action}' impossible depuis le statut '${order.status}'`
      );
    }

    const patch: Record<string, unknown> = { status: to, updated_at: trx.fn.now() };
    if (action === 'accept') {
      patch.accepted_at = trx.fn.now();
      patch.prepared_by = userId ?? null;
    }
    if (action === 'ready') patch.ready_at = trx.fn.now();
    if (action === 'deliver') {
      patch.delivered_at = trx.fn.now();
      patch.delivered_by = userId ?? null;
      patch.charged = true;
    }
    if (action === 'cancel') patch.cancelled_at = trx.fn.now();

    await trx('food_orders').where({ id }).update(patch);

    // À la livraison : impute les frais sur la note globale de la chambre
    if (action === 'deliver' && !order.charged) {
      const alreadyCharged = await trx('room_charges')
        .where({ source: 'room_service', reference_id: id })
        .first();
      if (!alreadyCharged) {
        await trx('room_charges').insert({
          reservation_id: order.reservation_id,
          room_id: order.room_id,
          label: `Room service ${order.order_number}`,
          amount: order.subtotal,
          source: 'room_service',
          reference_id: id,
          created_by: userId ?? null,
        });
      }
    }

    return getOrder(id, trx);
  });
}

export const acceptOrder = (id: string, userId?: string) => transition(id, 'accept', userId);
export const markReady = (id: string, userId?: string) => transition(id, 'ready', userId);
export const startDelivery = (id: string, userId?: string) => transition(id, 'start_delivery', userId);
export const deliverOrder = (id: string, userId?: string) => transition(id, 'deliver', userId);
export const cancelOrder = (id: string, userId?: string) => transition(id, 'cancel', userId);
