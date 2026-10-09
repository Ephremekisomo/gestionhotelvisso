import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Role } from '../types';

export function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="alert error">
        Accès refusé : votre rôle ({user.role}) ne permet pas d'accéder à cette page.
      </div>
    );
  }
  return <>{children}</>;
}
