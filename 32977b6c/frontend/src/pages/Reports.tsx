import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Printer,
  RefreshCw,
  Percent,
  CalendarDays,
  BedDouble,
  Banknote,
  Euro,
  Receipt,
  ChefHat,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { Report } from '../types';
import { money } from '../components/ui';

const RES_STATUS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  checked_in: 'Occupée (check-in)',
  checked_out: 'Terminée',
  cancelled: 'Annulée',
};
const ORDER_STATUS: Record<string, string> = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prête',
  delivering: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};
const METHOD: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
  transfer: 'Virement',
  other: 'Autre',
};
const SOURCE: Record<string, string> = {
  room_service: 'Room service',
  minibar: 'Minibar',
  laundry: 'Blanchisserie',
  parking: 'Parking',
  other: 'Autre',
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const startOfMonth = () => {
  const n = new Date();
  return iso(new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)));
};
const startOfYear = () => iso(new Date(new Date().getUTCFullYear(), 0, 1));

export default function Reports() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(iso(new Date()));
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get<{ data: Report }>('/reports', { from, to })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(load, [load]);

  const setRange = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
  };
  const last30 = () => {
    const t = new Date();
    const f = new Date();
    f.setUTCDate(f.getUTCDate() - 29);
    setRange(iso(f), iso(t));
  };
  const lastMonth = () => {
    const n = new Date();
    const f = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - 1, 1));
    const t = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 0));
    setRange(iso(f), iso(t));
  };

  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h1 className="h-icon"><BarChart3 size={24} /> Rapports &amp; statistiques</h1>
          <p>Synthèse de l'activité sur une période — réservée à la direction</p>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={load}><RefreshCw size={15} /> Actualiser</button>
          <button className="btn" onClick={() => window.print()} disabled={!data}><Printer size={16} /> Imprimer</button>
        </div>
      </div>

      <div className="toolbar no-print">
        <div>
          <label>Du</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label>Au</label>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="row" style={{ alignSelf: 'flex-end' }}>
          <button className="btn sm secondary" onClick={last30}>30 derniers jours</button>
          <button className="btn sm secondary" onClick={() => setRange(startOfMonth(), iso(new Date()))}>Ce mois</button>
          <button className="btn sm secondary" onClick={lastMonth}>Mois dernier</button>
          <button className="btn sm secondary" onClick={() => setRange(startOfYear(), iso(new Date()))}>Cette année</button>
        </div>
      </div>

      {error && <div className="alert error no-print">{error}</div>}
      {loading && !data && <div className="empty">Chargement du rapport…</div>}

      {data && (
        <div className="report">
          <div className="report-title print-only">
            <h2>Hôtel Wasso — Rapport d'activité</h2>
            <p>
              Période du {fmt(data.period.from)} au {fmt(data.period.to)} · Généré le{' '}
              {new Date(data.generated_at).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="grid cols-4">
            <div className="card stat">
              <div className="value">{data.rooms.occupancy_rate}%</div>
              <div className="label"><Percent size={13} /> Taux d'occupation (actuel)</div>
            </div>
            <div className="card stat">
              <div className="value">{data.reservations.total}</div>
              <div className="label"><CalendarDays size={13} /> Réservations créées</div>
            </div>
            <div className="card stat">
              <div className="value">{data.reservations.nights}</div>
              <div className="label"><BedDouble size={13} /> Nuitées vendues</div>
            </div>
            <div className="card stat">
              <div className="value">{money(data.reservations.room_revenue)}</div>
              <div className="label"><Euro size={13} /> CA hébergement (réservé)</div>
            </div>
            <div className="card stat">
              <div className="value">{money(data.revenue.paid_total)}</div>
              <div className="label"><Banknote size={13} /> Encaissé ({data.revenue.payments_count} paiements)</div>
            </div>
            <div className="card stat">
              <div className="value">{money(data.revenue.charges_total)}</div>
              <div className="label"><Receipt size={13} /> Charges chambre</div>
            </div>
            <div className="card stat">
              <div className="value">{money(data.revenue.room_service_revenue)}</div>
              <div className="label"><ChefHat size={13} /> CA room service (livré)</div>
            </div>
            <div className="card stat">
              <div className="value">{data.guests.new}</div>
              <div className="label"><Users size={13} /> Nouveaux clients</div>
            </div>
          </div>

          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Réservations par statut</h3>
              <table>
                <thead><tr><th>Statut</th><th>Nombre</th><th>Montant</th></tr></thead>
                <tbody>
                  {data.reservations.by_status.length === 0 && (
                    <tr><td colSpan={3} className="muted">Aucune réservation sur la période</td></tr>
                  )}
                  {data.reservations.by_status.map((r) => (
                    <tr key={r.status}>
                      <td>{RES_STATUS[r.status] ?? r.status}</td>
                      <td>{r.count}</td>
                      <td>{money(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>Encaissements par moyen de paiement</h3>
              <table>
                <thead><tr><th>Moyen</th><th>Nombre</th><th>Montant</th></tr></thead>
                <tbody>
                  {data.revenue.payments_by_method.length === 0 && (
                    <tr><td colSpan={3} className="muted">Aucun encaissement sur la période</td></tr>
                  )}
                  {data.revenue.payments_by_method.map((p) => (
                    <tr key={p.method}>
                      <td>{METHOD[p.method] ?? p.method}</td>
                      <td>{p.count}</td>
                      <td>{money(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>Charges chambre par source</h3>
              <table>
                <thead><tr><th>Source</th><th>Nombre</th><th>Montant</th></tr></thead>
                <tbody>
                  {data.revenue.charges_by_source.length === 0 && (
                    <tr><td colSpan={3} className="muted">Aucune charge sur la période</td></tr>
                  )}
                  {data.revenue.charges_by_source.map((c) => (
                    <tr key={c.source}>
                      <td>{SOURCE[c.source] ?? c.source}</td>
                      <td>{c.count}</td>
                      <td>{money(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>Room service par statut</h3>
              <table>
                <thead><tr><th>Statut</th><th>Commandes</th></tr></thead>
                <tbody>
                  {data.food_orders.by_status.length === 0 && (
                    <tr><td colSpan={2} className="muted">Aucune commande sur la période</td></tr>
                  )}
                  {data.food_orders.by_status.map((o) => (
                    <tr key={o.status}>
                      <td>{ORDER_STATUS[o.status] ?? o.status}</td>
                      <td>{o.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>État du parc (instantané)</h3>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="badge green">{data.rooms.available} disponibles</span>
              <span className="badge red">{data.rooms.occupied} occupées</span>
              <span className="badge amber">{data.rooms.cleaning} ménage</span>
              <span className="badge gray">{data.rooms.maintenance} maintenance</span>
              <span className="muted">Total : {data.rooms.total} chambres</span>
            </div>
          </div>

          <div className="report-foot print-only">
            Document généré automatiquement — Hôtel Wasso.
          </div>
        </div>
      )}
    </>
  );
}
