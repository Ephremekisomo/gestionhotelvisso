import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  UtensilsCrossed,
  ConciergeBell,
  CookingPot,
  Truck,
  ShieldCheck,
  BarChart3,
  Building2,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  section?: string;
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Tableau de bord', icon: LayoutDashboard, section: 'Pilotage' },
  { to: '/app/reservations', label: 'Réservations', icon: CalendarDays, section: 'Pilotage', roles: ['admin', 'manager', 'receptionist'] },
  { to: '/app/rooms', label: 'Chambres', icon: BedDouble, section: 'Pilotage', roles: ['admin', 'manager', 'receptionist'] },
  { to: '/app/guests', label: 'Clients', icon: Users, section: 'Pilotage', roles: ['admin', 'manager', 'receptionist'] },
  { to: '/app/menu', label: 'Carte / Menu', icon: UtensilsCrossed, section: 'Room service' },
  { to: '/app/order', label: 'Nouvelle commande', icon: ConciergeBell, section: 'Room service' },
  { to: '/app/kitchen', label: 'Écran cuisine', icon: CookingPot, section: 'Room service', roles: ['admin', 'manager', 'kitchen'] },
  { to: '/app/delivery', label: 'Livraisons', icon: Truck, section: 'Room service', roles: ['admin', 'manager', 'server'] },
  { to: '/app/reports', label: 'Rapports & stats', icon: BarChart3, section: 'Admin', roles: ['admin', 'manager'] },
  { to: '/app/users', label: 'Utilisateurs', icon: ShieldCheck, section: 'Admin', roles: ['admin'] },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  const visible = NAV.filter((n) => !n.roles || (user && n.roles.includes(user.role)));
  const sections = Array.from(new Set(visible.map((n) => n.section!)));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Building2 size={20} /> Hôtel<span>Manager</span></div>
        {sections.map((section) => (
          <div key={section}>
            <div className="nav-section">{section}</div>
            {visible
              .filter((n) => n.section === section)
              .map((n) => {
                const Icon = n.icon;
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === '/app'}
                    className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span className="label">{n.label}</span>
                  </NavLink>
                );
              })}
          </div>
        ))}
        <div className="sidebar-footer">
          <div className="who">{user?.full_name}</div>
          <div className="role">{user?.role}</div>
          <button className="btn ghost sm" style={{ marginTop: 10, width: '100%' }} onClick={logout}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
