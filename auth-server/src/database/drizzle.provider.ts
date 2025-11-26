import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../modules/user/infra/postgres/schema';
import ENVS from '../config/env';

const pool = new Pool({
  connectionString: ENVS.POSTGRES_URI,
});

export const db = drizzle(pool, { schema });
export type DrizzleDB = typeof db;

export const DRIZZLE_DB = 'DRIZZLE_DB';
