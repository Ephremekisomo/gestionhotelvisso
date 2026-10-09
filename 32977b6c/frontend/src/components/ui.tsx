import { ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Spinner() {
  return <div className="empty">Chargement…</div>;
}

export function ErrorAlert({ message }: { message: string }) {
  return <div className="alert error">{message}</div>;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  // chambres
  available: { label: 'Disponible', color: 'green' },
  occupied: { label: 'Occupée', color: 'red' },
  cleaning: { label: 'Ménage', color: 'amber' },
  maintenance: { label: 'Maintenance', color: 'gray' },
  // réservations
  pending: { label: 'En attente', color: 'amber' },
  confirmed: { label: 'Confirmée', color: 'blue' },
  checked_in: { label: 'Occupée (check-in)', color: 'green' },
  checked_out: { label: 'Terminée', color: 'gray' },
  cancelled: { label: 'Annulée', color: 'red' },
  // commandes
  preparing: { label: 'En préparation', color: 'amber' },
  ready: { label: 'Prête', color: 'blue' },
  delivering: { label: 'En livraison', color: 'purple' },
  delivered: { label: 'Livrée', color: 'green' },
  // paiements
  paid: { label: 'Payé', color: 'green' },
  refunded: { label: 'Remboursé', color: 'gray' },
  failed: { label: 'Échoué', color: 'red' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'gray' };
  return <span className={`badge ${s.color}`}>{s.label}</span>;
}

export const CATEGORY_LABEL: Record<string, string> = {
  starter: 'Entrée',
  main: 'Plat',
  side: 'Accompagnement',
  dessert: 'Dessert',
  drink: 'Boisson',
};

export function money(v: string | number) {
  return `${Number(v).toFixed(2)} €`;
}
