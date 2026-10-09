import { useEffect, useState, useCallback } from 'react';
import { CookingPot, RefreshCw, PartyPopper, StickyNote, Play, Check } from 'lucide-react';
import { api } from '../api/client';
import { FoodOrder } from '../types';
import { StatusBadge, money } from '../components/ui';

export default function KitchenBoard() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get<{ data: FoodOrder[] }>('/food-orders/queue/kitchen')
      .then((r) => setOrders(r.data)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (id: string, action: 'accept' | 'ready') => {
    try { await api.post(`/food-orders/${id}/${action}`); load(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="h-icon"><CookingPot size={24} /> Écran cuisine</h1><p>Nouvelles commandes et préparations en cours (auto-actualisation)</p></div>
        <button className="btn ghost" onClick={load}><RefreshCw size={15} /> Actualiser</button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {orders.length === 0 ? (
        <div className="empty"><PartyPopper size={28} style={{ marginBottom: 8 }} /> Aucune commande en attente</div>
      ) : (
        <div className="board">
          {orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="top">
                <div>
                  <div className="room">Chambre {o.room_number}</div>
                  <div className="muted">{o.order_number}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <ul className="order-items">
                {o.items?.map((it) => (
                  <li key={it.id}>
                    <strong>{it.quantity}×</strong> {it.name}
                    {it.options && <span className="muted"> — {it.options}</span>}
                  </li>
                ))}
              </ul>
              {o.notes && <div className="muted note-line"><StickyNote size={14} /> {o.notes}</div>}
              <div className="spread">
                <span className="muted">{new Date(o.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                <strong>{money(o.subtotal)}</strong>
              </div>
              {o.status === 'pending' && (
                <button className="btn" onClick={() => act(o.id, 'accept')}><Play size={15} /> Lancer la préparation</button>
              )}
              {o.status === 'preparing' && (
                <button className="btn success" onClick={() => act(o.id, 'ready')}><Check size={15} /> Plat prêt</button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
