import { Module, type OnModuleInit } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { ENVS } from '../config/env.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthController],
})
export class HealthModule implements OnModuleInit {
  constructor(private readonly healthController: HealthController) {}

  async onModuleInit(): Promise<void> {
    if (ENVS.DB_PROVIDER === 'postgres') {
      // Dynamic import so mongoose-only deployments never load pg at module scope
      const { pool } = await import('../database/drizzle.provider.js');
      this.healthController.setDatabaseCheck(async () => {
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      });
    } else {
      const mongoose = await import('mongoose');
      this.healthController.setDatabaseCheck(() => {
        const state = mongoose.default.connection.readyState;
        if (state !== 1) {
          throw new Error(`Mongoose connection state: ${state}`);
        }
        return Promise.resolve();
      });
    }
  }
}
