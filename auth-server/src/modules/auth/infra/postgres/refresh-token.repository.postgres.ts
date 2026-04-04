import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../domain/refresh-token.repository.interface';
import { refreshTokens } from '../../../user/infra/postgres/schema';
import { DRIZZLE_DB } from '../../../../database/drizzle.provider';
import type { DrizzleDB } from '../../../../database/drizzle.provider';

@Injectable()
export class RefreshTokenPostgresRepository
  implements RefreshTokenRepository
{
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async store(
    userId: string,
    token: { jti: string; hash: string; expiresAt: Date },
  ): Promise<void> {
    await this.db.insert(refreshTokens).values({
      userId,
      jti: token.jti,
      hash: token.hash,
      expiresAt: token.expiresAt,
      revoked: false,
    });
  }

  async findByJti(jti: string): Promise<StoredRefreshToken | null> {
    const result = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.jti, jti));

    if (result.length === 0) return null;

    const token = result[0];
    return {
      userId: token.userId,
      jti: token.jti,
      hash: token.hash,
      expiresAt: token.expiresAt,
      revoked: token.revoked,
    };
  }

  async revoke(jti: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.jti, jti));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }
}
