import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route introuvable: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Erreur d'unicité PostgreSQL
  if (isPgError(err) && err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Conflit: cette valeur existe déjà',
      details: err.detail,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    ...(!isProduction && err instanceof Error ? { error: err.message } : {}),
  });
}

function isPgError(err: any): err is { code: string; detail?: string } {
  return typeof err === 'object' && err !== null && typeof err.code === 'string';
}
