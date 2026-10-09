import { useEffect, useState, FormEvent } from 'react';
import { api } from '../api/client';
import { Guest } from '../types';
import { Modal } from '../components/ui';

const empty = { full_name: '', email: '', phone: '', address: '', id_document: '', nationality: '' };

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => {
    api
      .get<{ data: Guest[] }>('/guests', { limit: 100, search: search || undefined })
      .then((r) => setGuests(r.data))
      .catch((e) => setError(e.message));
  };

  useEffect(load, [search]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/guests', form);
      setOpen(false);
      setForm(empty);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Clients</h1><p>Répertoire des clients de l'hôtel</p></div>
        <button className="btn" onClick={() => setOpen(true)}>+ Nouveau client</button>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="toolbar">
        <input placeholder="Rechercher (nom, email, tél.)" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Nationalité</th></tr></thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.full_name}</strong></td>
                <td>{g.email || '—'}</td>
                <td>{g.phone || '—'}</td>
                <td>{g.nationality || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {guests.length === 0 && <div className="empty">Aucun client</div>}
      </div>

      {open && (
        <Modal title="Nouveau client" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="field"><label>Nom complet *</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="form-row">
              <div className="field"><label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="field"><label>Téléphone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="field"><label>Adresse</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="form-row">
              <div className="field"><label>Pièce d'identité</label>
                <input value={form.id_document} onChange={(e) => setForm({ ...form, id_document: e.target.value })} /></div>
              <div className="field"><label>Nationalité</label>
                <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn">Créer</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
