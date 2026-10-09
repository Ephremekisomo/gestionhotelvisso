import { useEffect, useState, useCallback } from 'react';
import { Truck, RefreshCw, ConciergeBell, Check } from 'lucide-react';
import { api } from '../api/client';
import { FoodOrder } from '../types';
import { StatusBadge, money } from '../components/ui';

export default function DeliveryBoard() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get<{ data: FoodOrder[] }>('/food-orders/queue/delivery')
      .then((r) => setOrders(r.data)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (id: string, action: 'deliver-start' | 'deliver') => {
    try { await api.post(`/food-orders/${id}/${action}`); load(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="h-icon"><Truck size={24} /> Livraisons</h1><p>Plateaux prêts et en cours de livraison (auto-actualisation)</p></div>
        <button className="btn ghost" onClick={load}><RefreshCw size={15} /> Actualiser</button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {orders.length === 0 ? (
        <div className="empty">Aucune livraison en attente</div>
      ) : (
        <div className="board">
          {orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="top">
                <div>
                  <div className="room">Chambre {o.room_number}</div>
                  <div className="muted">{o.guest_name} · {o.order_number}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <ul className="order-items">
                {o.items?.map((it) => (
                  <li key={it.id}><strong>{it.quantity}×</strong> {it.name}</li>
                ))}
              </ul>
              <div className="spread">
                <span className="muted">À imputer sur la note</span>
                <strong>{money(o.subtotal)}</strong>
              </div>
              {o.status === 'ready' && (
                <button className="btn" onClick={() => act(o.id, 'deliver-start')}><ConciergeBell size={15} /> Prendre en charge</button>
              )}
              {o.status === 'delivering' && (
                <button className="btn success" onClick={() => act(o.id, 'deliver')}><Check size={15} /> Livré (imputer)</button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
