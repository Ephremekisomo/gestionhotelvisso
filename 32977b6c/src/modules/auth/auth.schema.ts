import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (min 6)'),
  role: z.enum(['admin', 'manager', 'receptionist', 'kitchen', 'server']).default('receptionist'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
