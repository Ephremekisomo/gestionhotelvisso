import { useEffect, useState, FormEvent } from 'react';
import { api } from '../api/client';
import { Reservation, Guest, Room, Folio } from '../types';
import { Modal, StatusBadge, money } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);

export default function Reservations() {
  const [list, setList] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [form, setForm] = useState({
    guest_id: '', room_id: '', check_in: today(), check_out: today(), adults: 1, children: 0,
  });

  const load = () => {
    api.get<{ data: Reservation[] }>('/reservations', { limit: 100, status: status || undefined })
      .then((r) => setList(r.data)).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    api.get<{ data: Guest[] }>('/guests', { limit: 100 }).then((r) => setGuests(r.data)).catch(() => {});
    api.get<{ data: Room[] }>('/rooms', { limit: 100 }).then((r) => setRooms(r.data)).catch(() => {});
  }, [status]);

  const act = async (id: string, action: string) => {
    setError('');
    try {
      await api.post(`/reservations/${id}/${action}`);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const openFolio = async (id: string) => {
    setError('');
    try {
      const r = await api.get<{ data: Folio }>(`/reservations/${id}/folio`);
      setFolio(r.data);
    } catch (e: any) { setError(e.message); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reservations', form);
      setOpen(false);
      load();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Réservations</h1><p>Séjours, check-in/check-out et facturation</p></div>
        <button className="btn" onClick={() => setOpen(true)}>+ Nouvelle réservation</button>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((s) =>
            <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>N°</th><th>Client</th><th>Chambre</th><th>Arrivée</th><th>Départ</th><th>Total</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.reservation_number}</td>
                <td>{r.guest_name}</td>
                <td>{r.room_number}</td>
                <td>{r.check_in}</td>
                <td>{r.check_out}</td>
                <td>{money(r.total_price)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <div className="row">
                    {r.status === 'pending' && <button className="btn sm" onClick={() => act(r.id, 'confirm')}>Confirmer</button>}
                    {(r.status === 'pending' || r.status === 'confirmed') && <button className="btn sm success" onClick={() => act(r.id, 'check-in')}>Check-in</button>}
                    {r.status === 'checked_in' && <button className="btn sm secondary" onClick={() => act(r.id, 'check-out')}>Check-out</button>}
                    {(r.status === 'pending' || r.status === 'confirmed') && <button className="btn sm danger" onClick={() => act(r.id, 'cancel')}>Annuler</button>}
                    <button className="btn sm ghost" onClick={() => openFolio(r.id)}>Folio</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="empty">Aucune réservation</div>}
      </div>

      {open && (
        <Modal title="Nouvelle réservation" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="field"><label>Client *</label>
              <select required value={form.guest_id} onChange={(e) => setForm({ ...form, guest_id: e.target.value })}>
                <option value="">— choisir —</option>
                {guests.map((g) => <option key={g.id} value={g.id}>{g.full_name}</option>)}
              </select></div>
            <div className="field"><label>Chambre *</label>
              <select required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                <option value="">— choisir —</option>
                {rooms.map((rm) => <option key={rm.id} value={rm.id}>{rm.room_number} — {rm.room_type_name} ({rm.status})</option>)}
              </select></div>
            <div className="form-row">
              <div className="field"><label>Arrivée *</label>
                <input type="date" required value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
              <div className="field"><label>Départ *</label>
                <input type="date" required value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Adultes</label>
                <input type="number" min={1} value={form.adults} onChange={(e) => setForm({ ...form, adults: +e.target.value })} /></div>
              <div className="field"><label>Enfants</label>
                <input type="number" min={0} value={form.children} onChange={(e) => setForm({ ...form, children: +e.target.value })} /></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn">Créer</button>
            </div>
          </form>
        </Modal>
      )}

      {folio && (
        <Modal title={`Folio — ${folio.reservation.reservation_number}`} onClose={() => setFolio(null)}>
          <p className="muted">
            {folio.reservation.guest_name} · Chambre {folio.reservation.room_number} ·
            {folio.reservation.check_in} → {folio.reservation.check_out}
          </p>
          <table>
            <tbody>
              <tr><td>Séjour</td><td style={{ textAlign: 'right' }}>{money(folio.room_total)}</td></tr>
              {folio.charges.map((c) => (
                <tr key={c.id}><td>{c.label} <span className="badge gray">{c.source}</span></td>
                  <td style={{ textAlign: 'right' }}>{money(c.amount)}</td></tr>
              ))}
              <tr><td><strong>Total</strong></td><td style={{ textAlign: 'right' }}><strong>{money(folio.grand_total)}</strong></td></tr>
              <tr><td>Déjà payé</td><td style={{ textAlign: 'right' }}>{money(folio.paid_total)}</td></tr>
              <tr><td><strong>Solde dû</strong></td><td style={{ textAlign: 'right' }}><strong>{money(folio.balance)}</strong></td></tr>
            </tbody>
          </table>
          {folio.is_settled && <div className="alert success" style={{ marginTop: 12 }}>Note réglée</div>}
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setFolio(null)}>Fermer</button>
          </div>
        </Modal>
      )}
    </>
  );
}
