import { Module, Global } from '@nestjs/common';
import { db, DRIZZLE_DB } from './drizzle.provider';

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
export class DrizzleModule {}
