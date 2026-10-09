import { useEffect, useState, FormEvent } from 'react';
import { api } from '../api/client';
import { Room, RoomType, RoomStatus } from '../types';
import { Modal, StatusBadge, money } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { Upload, X } from 'lucide-react';

const STATUSES: RoomStatus[] = ['available', 'occupied', 'cleaning', 'maintenance'];

const emptyForm = { room_number: '', room_type_id: '', floor: 1, status: 'available' as RoomStatus, price_override: '' };

export default function Rooms() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'manager');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);

  const load = () => {
    api
      .get<{ data: Room[] }>('/rooms', { limit: 100, status: status || undefined })
      .then((r) => setRooms(r.data))
      .catch((e) => setError(e.message));
  };

  const loadTypes = () => {
    api
      .get<{ data: RoomType[] }>('/room-types', { limit: 100 })
      .then((r) => setTypes(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadTypes();
  }, [status]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setClearExisting(false);
    setOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      floor: room.floor,
      status: room.status,
      price_override: room.price_override ?? '',
    });
    setImageFile(null);
    setImagePreview(null);
    setClearExisting(false);
    setOpen(true);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setClearExisting(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setClearExisting(false);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      if (clearExisting) return null;
      return editing?.image_url ?? null;
    }
    setUploading(true);
    try {
      const res = await api.upload<{ data: { url: string } }>('/upload', imageFile);
      return res.data.url;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const imageUrl = await uploadImage();
    if (uploading) return;
    try {
      const payload: any = {
        room_number: form.room_number,
        room_type_id: form.room_type_id,
        floor: Number(form.floor),
        status: form.status,
        price_override: form.price_override ? Number(form.price_override) : null,
        image_url: imageUrl,
      };
      if (editing) {
        await api.put(`/rooms/${editing.id}`, payload);
      } else {
        await api.post('/rooms', payload);
      }
      setOpen(false);
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setClearExisting(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const changeStatus = async (id: string, s: RoomStatus) => {
    try {
      await api.patch(`/rooms/${id}/status`, { status: s });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Chambres</h1><p>Gérez l'état et le parc de chambres de l'hôtel</p></div>
        {canManage && <button className="btn" onClick={openCreate}>+ Nouvelle chambre</button>}
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Photo</th><th>N°</th><th>Étage</th><th>Type</th><th>Prix/nuit</th>
              <th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td style={{ width: 60 }}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={`Chambre ${r.room_number}`} style={{ width: '100%', height: 48, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, background: '#e2e8f0', borderRadius: 4 }} />
                  )}
                </td>
                <td><strong>{r.room_number}</strong></td>
                <td>{r.floor}</td>
                <td>{r.room_type_name}</td>
                <td>{money(r.price_override ?? r.room_type_base_price ?? 0)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {canManage && (
                    <>
                      <button className="btn sm secondary" onClick={() => openEdit(r)} style={{ marginRight: 6 }}>Modifier</button>
                      <button className="btn sm secondary" onClick={() => changeStatus(r.id, r.status === 'available' ? 'occupied' : 'available')}>
                        Toggle
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rooms.length === 0 && <div className="empty">Aucune chambre</div>}
      </div>

      {open && (
        <Modal title={editing ? 'Modifier la chambre' : 'Nouvelle chambre'} onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="field">
              <label>Photo de la chambre</label>
              {editing && !imageFile && !clearExisting && editing.image_url && (
                <div style={{ marginBottom: 10 }}>
                  <img src={editing.image_url} alt="Actuelle" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                  <button type="button" className="btn sm danger" style={{ width: '100%', marginTop: 6 }} onClick={removeImage}>
                    Supprimer l'image
                  </button>
                </div>
              )}
              {!imageFile && !clearExisting && (
                <label
                  htmlFor="room-image"
                  style={{
                    display: 'block', border: '2px dashed #cbd5e1', borderRadius: 8, padding: '20px',
                    textAlign: 'center', cursor: 'pointer', background: '#f8fafc', marginBottom: 10,
                  }}
                >
                  <Upload size={20} style={{ marginRight: 6 }} />
                  Cliquez pour uploader une image
                </label>
              )}
              <input
                id="room-image"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
              {imagePreview && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <img src={imagePreview} alt="Aperçu" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                  <button type="button" className="btn sm danger" onClick={removeImage} style={{ position: 'absolute', top: 4, right: 4, padding: '2px 6px' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="field">
              <label>Numéro de chambre *</label>
              <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Type de chambre *</label>
                <select required value={form.room_type_id} onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}>
                  <option value="">Choisir…</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({money(t.base_price)} / {t.capacity} pers.)</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Étage</label>
                <input type="number" min="0" max="200" value={form.floor} onChange={(e) => setForm({ ...form, floor: +e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Statut</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Prix spécifique (€)</label>
                <input type="number" step="0.01" min="0" value={form.price_override} onChange={(e) => setForm({ ...form, price_override: e.target.value })} placeholder="Optionnel (sinon: le type)" />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => { setOpen(false); setEditing(null); setImageFile(null); setImagePreview(null); setClearExisting(false); }}>
                Annuler
              </button>
              <button className="btn" disabled={uploading}>
                {uploading ? 'Envoi de l\'image…' : (editing ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
