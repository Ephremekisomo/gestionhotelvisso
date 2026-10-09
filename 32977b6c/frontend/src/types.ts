export type Role = 'admin' | 'manager' | 'receptionist' | 'kitchen' | 'server';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RoomType {
  id: string;
  name: string;
  description: string | null;
  base_price: string;
  capacity: number;
}

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: RoomStatus;
  price_override: string | null;
  image_url: string | null;
  room_type_name?: string;
  room_type_base_price?: string;
  room_type_capacity?: number;
}

export interface Guest {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  id_document: string | null;
  nationality: string | null;
  notes: string | null;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export interface Reservation {
  id: string;
  reservation_number: string;
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  total_price: string;
  notes: string | null;
  guest_name?: string;
  room_number?: string;
  room_type_name?: string;
}

export interface Charge {
  id: string;
  label: string;
  amount: string;
  source: string;
  created_at: string;
}

export interface Payment {
  id: string;
  amount: string;
  method: string;
  status: string;
  created_at: string;
}

export interface Folio {
  reservation: {
    id: string;
    reservation_number: string;
    status: ReservationStatus;
    room_number: string;
    guest_name: string;
    check_in: string;
    check_out: string;
  };
  room_total: number;
  charges: Charge[];
  charges_total: number;
  payments: Payment[];
  paid_total: number;
  grand_total: number;
  balance: number;
  is_settled: boolean;
}

export type MenuCategory = 'starter' | 'main' | 'side' | 'dessert' | 'drink';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: MenuCategory;
  price: string;
  allergens: string[];
  is_available: boolean;
  preparation_time_min: number;
}

export type FoodOrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface FoodOrderItem {
  id: string;
  name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  options: string | null;
}

export interface FoodOrder {
  id: string;
  order_number: string;
  room_id: string;
  room_number?: string;
  guest_name?: string;
  reservation_number?: string;
  status: FoodOrderStatus;
  subtotal: string;
  notes: string | null;
  charged: boolean;
  created_at: string;
  items?: FoodOrderItem[];
}

export interface Dashboard {
  date: string;
  rooms: {
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
    occupancy_rate: number;
  };
  reservations: { active: number };
  guests: { total: number };
  revenue: { total_paid: number };
  today: {
    arrivals: Array<{ id: string; reservation_number: string; guest_name: string }>;
    departures: Array<{ id: string; reservation_number: string; guest_name: string }>;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Report {
  period: { from: string; to: string };
  generated_at: string;
  rooms: {
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
    occupancy_rate: number;
  };
  reservations: {
    total: number;
    nights: number;
    room_revenue: number;
    by_status: Array<{ status: string; count: number; total: number }>;
  };
  revenue: {
    paid_total: number;
    payments_count: number;
    charges_total: number;
    charges_count: number;
    room_service_revenue: number;
    payments_by_method: Array<{ method: string; count: number; total: number }>;
    charges_by_source: Array<{ source: string; count: number; total: number }>;
  };
  food_orders: {
    total: number;
    revenue: number;
    by_status: Array<{ status: string; count: number }>;
  };
  guests: { new: number; total: number };
}
