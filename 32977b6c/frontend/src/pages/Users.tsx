import { useEffect, useState, FormEvent } from 'react';
import { api } from '../api/client';
import { User, Role } from '../types';
import { Modal, StatusBadge } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

const ROLES: Role[] = ['admin', 'manager', 'receptionist', 'kitchen', 'server'];
const empty = { full_name: '', email: '', password: '', role: 'receptionist' as Role };

export default function Users() {
  const { user: current } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    api.get<{ data: User[] }>('/users', { limit: 100 })
      .then((r) => setUsers(r.data)).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setOpen(false);
      setForm(empty);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const toggleActive = async (u: User) => {
    try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); load(); }
    catch (e: any) { setError(e.message); }
  };

  const remove = async (u: User) => {
    if (!confirm(`Supprimer ${u.full_name} ?`)) return;
    try { await api.del(`/users/${u.id}`); load(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Utilisateurs</h1><p>Comptes du personnel et rôles</p></div>
        <button className="btn" onClick={() => setOpen(true)}>+ Nouvel utilisateur</button>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.full_name}</strong>{u.id === current?.id && <span className="muted"> (vous)</span>}</td>
                <td>{u.email}</td>
                <td><span className="badge purple">{u.role}</span></td>
                <td><StatusBadge status={u.is_active ? 'available' : 'cancelled'} /></td>
                <td>
                  <div className="row">
                    <button className="btn sm secondary" onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    {u.id !== current?.id && (
                      <button className="btn sm danger" onClick={() => remove(u)}>Supprimer</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Nouvel utilisateur" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="field"><label>Nom complet *</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="field"><label>Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Mot de passe * (min 6)</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="field"><label>Rôle</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select></div>
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
