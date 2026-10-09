import { createApp } from './app';
import { env } from './config/env';
import { db, assertDatabaseConnection } from './config/db';

async function bootstrap() {
  try {
    await assertDatabaseConnection();
    console.log('Connexion à la base de données établie');
  } catch (err) {
    console.error('Échec de connexion à la base de données:', err);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Serveur démarré sur http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} reçu, arrêt en cours...`);
    server.close(async () => {
      await db.destroy();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
