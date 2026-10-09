import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Dashboard as Dash, FoodOrder } from '../types';
import { StatusBadge, money } from '../components/ui';

export default function Dashboard() {
  const [data, setData] = useState<Dash | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    api
      .get<{ data: Dash }>('/dashboard')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
    api
      .get<{ data: FoodOrder[] }>('/food-orders', { limit: 8 })
      .then((r) => setOrders(r.data))
      .catch(() => {});
  };

  useEffect(load, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="empty">Chargement…</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vision temps réel de l'activité — {data.date}</p>
        </div>
        <button className="btn ghost" onClick={load}><RefreshCw size={15} /> Actualiser</button>
      </div>

      <div className="grid cols-4">
        <div className="card stat">
          <div className="value">{data.rooms.occupancy_rate}%</div>
          <div className="label">Taux d'occupation</div>
        </div>
        <div className="card stat">
          <div className="value">{data.rooms.available}</div>
          <div className="label">Chambres disponibles</div>
        </div>
        <div className="card stat">
          <div className="value">{data.reservations.active}</div>
          <div className="label">Réservations actives</div>
        </div>
        <div className="card stat">
          <div className="value">{money(data.revenue.total_paid)}</div>
          <div className="label">Encaissé total</div>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>État des chambres</h3>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge green">{data.rooms.available} dispo</span>
            <span className="badge red">{data.rooms.occupied} occupées</span>
            <span className="badge amber">{data.rooms.cleaning} ménage</span>
            <span className="badge gray">{data.rooms.maintenance} maint.</span>
          </div>
        </div>
        <div className="card">
          <h3>Arrivées du jour</h3>
          {data.today.arrivals.length === 0 && <p className="muted">Aucune arrivée</p>}
          {data.today.arrivals.map((a) => (
            <div key={a.id} className="spread" style={{ padding: '4px 0' }}>
              <span>{a.guest_name}</span>
              <span className="muted">{a.reservation_number}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Départs du jour</h3>
          {data.today.departures.length === 0 && <p className="muted">Aucun départ</p>}
          {data.today.departures.map((d) => (
            <div key={d.id} className="spread" style={{ padding: '4px 0' }}>
              <span>{d.guest_name}</span>
              <span className="muted">{d.reservation_number}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Dernières commandes room service</h3>
        {orders.length === 0 ? (
          <p className="muted">Aucune commande récente</p>
        ) : (
          <table>
            <thead>
              <tr><th>N°</th><th>Chambre</th><th>Montant</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_number}</td>
                  <td>{o.room_number}</td>
                  <td>{money(o.subtotal)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
