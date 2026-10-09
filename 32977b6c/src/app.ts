import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import apiRoutes from './routes';
import uploadRoutes from './modules/upload/upload.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { isProduction } from './config/env';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));
  if (!isProduction) app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/v1', apiRoutes);
  app.use('/api/v1/upload', uploadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
