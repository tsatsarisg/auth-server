import { pgTable, uuid, timestamp, boolean, text } from 'drizzle-orm/pg-core';
// Cross-context import allowed only for the FK reference: Authentication
// references Identity's users table by id, it does not own or query it.
import { users } from '../../../../../identity/shared/adapters/postgres/schema/user.schema.js';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  jti: text('jti').notNull().unique(),
  hash: text('hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type RefreshTokenRecord = typeof refreshTokens.$inferSelect;
export type NewRefreshTokenRecord = typeof refreshTokens.$inferInsert;
