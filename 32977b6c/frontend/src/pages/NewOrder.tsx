import { useEffect, useState } from 'react';
import { Plus, Minus, Send } from 'lucide-react';
import { api } from '../api/client';
import { MenuItem, Room } from '../types';
import { CATEGORY_LABEL, money } from '../components/ui';

interface Line { qty: number; options: string; }

export default function NewOrder() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState('');
  const [cart, setCart] = useState<Record<string, Line>>({});
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.get<{ data: MenuItem[] }>('/menu-items', { limit: 100, available_only: true })
      .then((r) => setMenu(r.data)).catch(() => {});
    api.get<{ data: Room[] }>('/rooms', { limit: 100, status: 'occupied' })
      .then((r) => setRooms(r.data)).catch(() => {});
  }, []);

  const add = (id: string) =>
    setCart((c) => ({ ...c, [id]: { qty: (c[id]?.qty ?? 0) + 1, options: c[id]?.options ?? '' } }));
  const remove = (id: string) =>
    setCart((c) => {
      const n = { ...c };
      if (n[id]?.qty > 1) n[id] = { ...n[id], qty: n[id].qty - 1 };
      else delete n[id];
      return n;
    });
  const setOptions = (id: string, options: string) =>
    setCart((c) => ({ ...c, [id]: { ...c[id], options } }));

  const lines = Object.entries(cart).map(([id, l]) => ({ item: menu.find((m) => m.id === id)!, ...l }));
  const total = lines.reduce((s, l) => s + Number(l.item.price) * l.qty, 0);

  const submit = async () => {
    setMsg(null);
    if (!roomId) return setMsg({ type: 'err', text: 'Choisissez une chambre occupée' });
    if (lines.length === 0) return setMsg({ type: 'err', text: 'Le panier est vide' });
    try {
      await api.post('/food-orders', {
        room_id: roomId,
        notes: notes || null,
        items: lines.map((l) => ({
          menu_item_id: l.item.id,
          quantity: l.qty,
          options: l.options || null,
        })),
      });
      setMsg({ type: 'ok', text: 'Commande envoyée en cuisine' });
      setCart({});
      setNotes('');
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  const byCat = menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <div className="page-head">
        <div><h1>Nouvelle commande</h1><p>Room service — la commande doit concerner une chambre occupée</p></div>
      </div>
      {msg && <div className={`alert ${msg.type === 'ok' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="grid cols-2">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Chambre (occupée) *</label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">— choisir une chambre occupée —</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number} (étage {r.floor})</option>)}
              </select>
              {rooms.length === 0 && <p className="muted" style={{ marginTop: 8 }}>Aucune chambre occupée. Faites un check-in d'abord.</p>}
            </div>
          </div>

          {Object.entries(byCat).map(([cat, items]) => (
            <div className="card" key={cat} style={{ marginBottom: 16 }}>
              <h3>{CATEGORY_LABEL[cat]}</h3>
              {items.map((m) => (
                <div className="cart-line" key={m.id}>
                  <div>
                    <strong>{m.name}</strong> — {money(m.price)}
                    {m.allergens?.length > 0 && <div className="muted">{m.allergens.join(', ')}</div>}
                  </div>
                  <div className="row">
                    {cart[m.id] && (
                      <>
                        <button className="btn sm secondary icon-btn" onClick={() => remove(m.id)}><Minus size={14} /></button>
                        <span style={{ minWidth: 20, textAlign: 'center' }}>{cart[m.id].qty}</span>
                      </>
                    )}
                    <button className="btn sm icon-btn" onClick={() => add(m.id)}><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <h3>Panier</h3>
            {lines.length === 0 && <p className="muted">Aucun article</p>}
            {lines.map((l) => (
              <div key={l.item.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="spread">
                  <span>{l.qty}× {l.item.name}</span>
                  <span>{money(Number(l.item.price) * l.qty)}</span>
                </div>
                <input
                  style={{ marginTop: 6 }}
                  placeholder="Options (ex. cuisson, sans oignons…)"
                  value={l.options}
                  onChange={(e) => setOptions(l.item.id, e.target.value)}
                />
              </div>
            ))}
            <div className="field" style={{ marginTop: 12 }}>
              <label>Note globale</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions pour la cuisine…" />
            </div>
            <div className="spread" style={{ fontWeight: 700, fontSize: 18, margin: '8px 0 16px' }}>
              <span>Total</span><span>{money(total)}</span>
            </div>
            <button className="btn success" style={{ width: '100%' }} onClick={submit}>
              <Send size={16} /> Envoyer la commande en cuisine
            </button>
            <p className="muted" style={{ marginTop: 10 }}>
              Le montant sera imputé sur la note de la chambre à la livraison.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
