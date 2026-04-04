import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { db, pool, DRIZZLE_DB } from './drizzle.provider';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DB,
      useValue: db,
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DrizzleModule implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await pool.end();
  }
}
