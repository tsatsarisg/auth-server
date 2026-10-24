import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { HealthController } from './health.controller.js';
import { DB_HEALTH_CHECK, type DbHealthCheck } from './db-health-check.js';
import { ENVS } from '../config/env.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    {
      provide: DB_HEALTH_CHECK,
      inject: ENVS.DB_PROVIDER === 'mongo' ? [getConnectionToken()] : [],
      useFactory: async (connection?: Connection): Promise<DbHealthCheck> => {
        if (ENVS.DB_PROVIDER === 'postgres') {
          // Dynamic import so mongoose-only deployments never load pg at module scope
          const { pool } = await import('../database/drizzle.provider.js');
          return async () => {
            const client = await pool.connect();
            try {
              await client.query('SELECT 1');
            } finally {
              client.release();
            }
          };
        }

        if (!connection) throw new Error('MongoDB connection provider is missing');
        return () => {
          const state = connection.readyState;
          if (state !== 1) {
            throw new Error(`Mongoose connection state: ${state}`);
          }
          return Promise.resolve();
        };
      },
    },
  ],
})
export class HealthModule {}
