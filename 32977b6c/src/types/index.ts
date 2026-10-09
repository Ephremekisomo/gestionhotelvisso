export type UserRole = 'admin' | 'manager' | 'receptionist' | 'kitchen' | 'server';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
