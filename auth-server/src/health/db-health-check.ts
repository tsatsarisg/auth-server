/**
 * Probe for the active database. Resolves when the database is reachable,
 * rejects otherwise. Bound via factory so only the active driver is loaded.
 */
export type DbHealthCheck = () => Promise<void>;

export const DB_HEALTH_CHECK = 'DB_HEALTH_CHECK';
