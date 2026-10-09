import { useEffect, useState, FormEvent } from 'react';
import { api } from '../api/client';
import { MenuItem, MenuCategory } from '../types';
import { Modal, CATEGORY_LABEL, money } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

const CATS: MenuCategory[] = ['starter', 'main', 'side', 'dessert', 'drink'];
const empty = { name: '', description: '', category: 'main' as MenuCategory, price: '', allergens: '', preparation_time_min: 15 };

export default function Menu() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'manager', 'kitchen');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cat, setCat] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    api.get<{ data: MenuItem[] }>('/menu-items', { limit: 100, category: cat || undefined })
      .then((r) => setItems(r.data)).catch((e) => setError(e.message));
  };
  useEffect(load, [cat]);

  const toggle = async (item: MenuItem) => {
    try {
      await api.patch(`/menu-items/${item.id}/availability`, { is_available: !item.is_available });
      load();
    } catch (e: any) { setError(e.message); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/menu-items', {
        ...form,
        price: Number(form.price),
        allergens: form.allergens.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setOpen(false);
      setForm(empty);
      load();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Carte / Menu</h1><p>Plats et boissons disponibles en room service</p></div>
        {canManage && <button className="btn" onClick={() => setOpen(true)}>+ Nouvel article</button>}
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="toolbar">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>
      <div className="grid cols-3">
        {items.map((m) => (
          <div className="card" key={m.id} style={{ opacity: m.is_available ? 1 : 0.55 }}>
            <div className="spread">
              <strong>{m.name}</strong>
              <span className="badge purple">{CATEGORY_LABEL[m.category]}</span>
            </div>
            <p className="muted" style={{ margin: '8px 0' }}>{m.description}</p>
            <div className="spread">
              <span style={{ fontSize: 18, fontWeight: 700 }}>{money(m.price)}</span>
              <span className="muted">⏱ {m.preparation_time_min} min</span>
            </div>
            {m.allergens?.length > 0 && (
              <div className="muted" style={{ marginTop: 6 }}>Allergènes : {m.allergens.join(', ')}</div>
            )}
            <div className="row" style={{ marginTop: 12 }}>
              <span className={`badge ${m.is_available ? 'green' : 'red'}`}>
                {m.is_available ? 'Disponible' : 'Rupture'}
              </span>
              {canManage && (
                <button className="btn sm secondary" onClick={() => toggle(m)}>
                  {m.is_available ? 'Masquer (rupture)' : 'Remettre dispo'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <div className="empty">Aucun article</div>}

      {open && (
        <Modal title="Nouvel article" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="field"><label>Nom *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-row">
              <div className="field"><label>Catégorie</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}>
                  {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select></div>
              <div className="field"><label>Prix (€) *</label>
                <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Allergènes (séparés par des virgules)</label>
                <input value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} /></div>
              <div className="field"><label>Temps de prép. (min)</label>
                <input type="number" min="0" value={form.preparation_time_min} onChange={(e) => setForm({ ...form, preparation_time_min: +e.target.value })} /></div>
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
