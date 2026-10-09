import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Protected } from './components/Protected';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import Reservations from './pages/Reservations';
import Menu from './pages/Menu';
import NewOrder from './pages/NewOrder';
import KitchenBoard from './pages/KitchenBoard';
import DeliveryBoard from './pages/DeliveryBoard';
import Users from './pages/Users';
import Reports from './pages/Reports';

function Shell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<Protected roles={['admin', 'manager', 'receptionist']}><Rooms /></Protected>} />
        <Route path="guests" element={<Protected roles={['admin', 'manager', 'receptionist']}><Guests /></Protected>} />
        <Route path="reservations" element={<Protected roles={['admin', 'manager', 'receptionist']}><Reservations /></Protected>} />
        <Route path="menu" element={<Menu />} />
        <Route path="order" element={<NewOrder />} />
        <Route path="kitchen" element={<Protected roles={['admin', 'manager', 'kitchen']}><KitchenBoard /></Protected>} />
        <Route path="delivery" element={<Protected roles={['admin', 'manager', 'server']}><DeliveryBoard /></Protected>} />
        <Route path="reports" element={<Protected roles={['admin', 'manager']}><Reports /></Protected>} />
        <Route path="users" element={<Protected roles={['admin']}><Users /></Protected>} />
        <Route path="*" element={<div className="empty">Page introuvable</div>} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app/*" element={<Shell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
