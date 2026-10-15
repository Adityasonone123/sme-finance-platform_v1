import { Request, Response } from 'express';
import { HealthResponse, RootResponse } from '../types/index.js';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

export const getRootStatus = (_req: Request, res: Response<RootResponse>): void => {
  res.json({
    message: 'SME Finance Platform API',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
};

export const getHealthStatus = async (_req: Request, res: Response<HealthResponse>): Promise<void> => {
  let dbStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database connection check warning:', error);
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    message: 'SME Finance Platform API is healthy',
    database: dbStatus,
  });
};
