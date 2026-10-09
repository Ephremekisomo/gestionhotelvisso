import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronDown, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import '../landing.css';

interface PublicRoom {
  id: string;
  room_number: string;
  floor: number;
  room_type_name: string;
  room_type_description: string | null;
  capacity: number;
  price: string;
  image_url: string | null;
}

const GALLERY = [
  { src: '/images/lobby.png', caption: 'Hall d\'accueil' },
  { src: '/images/room.png', caption: 'Suite Deluxe' },
  { src: '/images/pool.png', caption: 'Piscine & détente' },
  { src: '/images/restaurant.png', caption: 'Restaurant gastronomique' },
  { src: '/images/hero.png', caption: 'Vue extérieure au crépuscule' },
];

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  room_id: '',
  check_in: today(),
  check_out: today(),
  adults: 1,
  children: 0,
  notes: '',
};

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get<{ data: PublicRoom[] }>('/public/rooms').then((r) => {
      setRooms(r.data);
      if (r.data.length) setForm((f) => ({ ...f, room_id: f.room_id || r.data[0].id }));
    }).catch(() => {});
  }, []);

  const pickRoom = (id: string) => {
    setForm((f) => ({ ...f, room_id: id }));
    document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth' });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    try {
      const r = await api.post<{ data: { reservation_number: string; message: string; total_price: string } }>(
        '/public/reservation-requests',
        { ...form, notes: form.notes || null, phone: form.phone || null }
      );
      setMsg({
        type: 'ok',
        text: `${r.data.message} Référence : ${r.data.reservation_number} (total estimé ${Number(r.data.total_price).toFixed(2)} €).`,
      });
      setForm({ ...emptyForm, room_id: form.room_id });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="landing">
      <nav className={`w-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="w-logo">Wasso<span>.</span></div>
        <div className="w-links">
          <a href="#accueil">Accueil</a>
          <a href="#chambres">Chambres</a>
          <a href="#galerie">Galerie</a>
          <a href="#contact">Contact</a>
          <a className="w-cta" href="#reserver">Réserver</a>
          <Link className="w-staff" to="/login">Espace staff <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <header className="w-hero" id="accueil">
        <div>
          <div className="overline">
            Hôtel &amp; Resort <span className="w-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} fill="currentColor" />)}</span>
          </div>
          <h1>Hôtel Wasso</h1>
          <p className="tag">
            Un havre de paix où l'élégance rencontre le confort. Vivez une expérience
            inoubliable entre raffinement, gastronomie et sérénité.
          </p>
          <div className="btns">
            <a className="w-btn gold" href="#reserver">Réserver une chambre</a>
            <a className="w-btn outline" href="#galerie">Découvrir l'hôtel</a>
          </div>
        </div>
        <div className="w-scroll"><ChevronDown size={26} /></div>
      </header>

      <div className="w-stats">
        <div><div className="num">120+</div><div className="lbl">Chambres &amp; suites</div></div>
        <div><div className="num">4.9</div><div className="lbl">Note voyageurs</div></div>
        <div><div className="num">24/7</div><div className="lbl">Room service</div></div>
        <div><div className="num">15</div><div className="lbl">Ans d'excellence</div></div>
      </div>

      <section className="w-section" id="chambres">
        <div className="w-head">
          <div className="overline">Hébergement</div>
          <h2>Nos chambres disponibles</h2>
          <p>Chaque chambre est pensée comme un cocon de confort, alliant design contemporain et chaleur accueillante.</p>
          <div className="w-divider" />
        </div>
        <div className="w-rooms">
          {rooms.map((r) => (
            <div className="w-room" key={r.id}>
              <div
                className="img"
                style={{
                  backgroundImage: r.image_url ? `url(${r.image_url})` : undefined,
                }}
              />
              <div className="body">
                <h3>{r.room_type_name} — n°{r.room_number}</h3>
                <div className="meta">Étage {r.floor} · jusqu'à {r.capacity} pers.</div>
                <p className="meta">{r.room_type_description}</p>
                <div className="price">{Number(r.price).toFixed(2)} € <small>/ nuit</small></div>
                <button className="w-btn gold" onClick={() => pickRoom(r.id)}>Réserver</button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>Aucune chambre disponible actuellement.</p>}
        </div>
      </section>

      <section className="w-section dark" id="galerie">
        <div className="w-head">
          <div className="overline">Galerie</div>
          <h2>Découvrez l'hôtel en images</h2>
          <div className="w-divider" />
        </div>
        <div className="w-gallery">
          {GALLERY.map((g) => (
            <figure key={g.src}>
              <img src={g.src} alt={g.caption} loading="lazy" />
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="w-section" id="reserver">
        <div className="w-head">
          <div className="overline">Réservation</div>
          <h2>Demandez votre séjour</h2>
          <p>Remplissez le formulaire : notre équipe confirmera votre réservation dans les plus brefs délais.</p>
          <div className="w-divider" />
        </div>
        <form className="w-book" onSubmit={submit}>
          {msg && <div className={`w-msg ${msg.type}`}>{msg.text}</div>}
          <div className="grid2">
            <div className="field"><label>Nom complet *</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="field"><label>Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid2">
            <div className="field"><label>Téléphone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Chambre *</label>
              <select required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.room_type_name} — n°{r.room_number} ({Number(r.price).toFixed(2)} €/nuit)</option>
                ))}
              </select></div>
          </div>
          <div className="grid2">
            <div className="field"><label>Arrivée *</label>
              <input type="date" required value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
            <div className="field"><label>Départ *</label>
              <input type="date" required value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
          </div>
          <div className="grid2">
            <div className="field"><label>Adultes</label>
              <input type="number" min={1} max={20} value={form.adults} onChange={(e) => setForm({ ...form, adults: +e.target.value })} /></div>
            <div className="field"><label>Enfants</label>
              <input type="number" min={0} max={20} value={form.children} onChange={(e) => setForm({ ...form, children: +e.target.value })} /></div>
          </div>
          <div className="field"><label>Demandes particulières</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="w-btn gold submit" disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer ma demande'}
          </button>
        </form>
      </section>

      <footer className="w-footer" id="contact">
        <div className="cols">
          <div>
            <h4>Hôtel Wasso</h4>
            <p>L'art de recevoir, depuis 2011. Un établissement cinq étoiles au cœur d'un cadre d'exception.</p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>12 Avenue de l'Océan<br />contact@hotel-wasso.com<br />+33 1 23 45 67 89</p>
          </div>
          <div>
            <h4>Navigation</h4>
            <p>
              <a href="#chambres">Chambres</a><br />
              <a href="#galerie">Galerie</a><br />
              <a href="#reserver">Réservation</a><br />
              <Link to="/login">Espace staff</Link>
            </p>
          </div>
        </div>
        <div className="bottom">© {new Date().getFullYear()} Hôtel Wasso — Tous droits réservés.</div>
      </footer>
    </div>
  );
}
