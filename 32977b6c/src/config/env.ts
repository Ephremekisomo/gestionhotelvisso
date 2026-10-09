import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: parseInt(required('PORT', '4000'), 10),
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/hotel'
  ),
  jwtSecret: required('JWT_SECRET', 'dev-secret'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '7d'),
  bcryptSaltRounds: parseInt(required('BCRYPT_SALT_ROUNDS', '10'), 10),
};

export const isProduction = env.nodeEnv === 'production';
