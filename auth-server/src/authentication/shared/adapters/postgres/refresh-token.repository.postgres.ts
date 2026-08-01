import { Injectable, Inject } from '@nestjs/common';
import { and, eq, or, lt } from 'drizzle-orm';
import type { RefreshTokenRepository, StoredRefreshToken } from '../../ports/refresh-token.repository.js';
import { refreshTokens } from './schema/index.js';
import { DRIZZLE_DB } from '../../../../database/drizzle.provider.js';
import type { DrizzleDB } from '../../../../database/drizzle.provider.js';

@Injectable()
export class RefreshTokenPostgresRepository implements RefreshTokenRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async store(userId: string, token: { jti: string; hash: string; expiresAt: Date }): Promise<void> {
    await this.db.insert(refreshTokens).values({
      userId,
      jti: token.jti,
      hash: token.hash,
      expiresAt: token.expiresAt,
      revoked: false,
    });
  }

  async findByJti(jti: string): Promise<StoredRefreshToken | null> {
    const result = await this.db.select().from(refreshTokens).where(eq(refreshTokens.jti, jti));

    if (result.length === 0) return null;

    const token = result[0];
    if (!token) return null;
    return {
      userId: token.userId,
      jti: token.jti,
      hash: token.hash,
      expiresAt: token.expiresAt,
      revoked: token.revoked,
    };
  }

  async claim(jti: string): Promise<StoredRefreshToken | null> {
    const result = await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(and(eq(refreshTokens.jti, jti), eq(refreshTokens.revoked, false)))
      .returning();

    const token = result[0];
    if (!token) return null;
    return {
      userId: token.userId,
      jti: token.jti,
      hash: token.hash,
      expiresAt: token.expiresAt,
      revoked: true,
    };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));
  }

  async deleteExpiredAndRevoked(): Promise<number> {
    const result = await this.db
      .delete(refreshTokens)
      .where(or(eq(refreshTokens.revoked, true), lt(refreshTokens.expiresAt, new Date())))
      .returning({ id: refreshTokens.id });
    return result.length;
  }
}
