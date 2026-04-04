import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../identity/shared/adapters/postgres/schema/index.js';
import { ENVS } from '../config/env';

export const pool = new Pool({
  connectionString: ENVS.POSTGRES_URI,
});

export const db = drizzle(pool, { schema });
export type DrizzleDB = typeof db;

export const DRIZZLE_DB = 'DRIZZLE_DB';
