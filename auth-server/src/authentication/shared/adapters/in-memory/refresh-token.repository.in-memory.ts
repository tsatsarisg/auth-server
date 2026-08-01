import type { RefreshTokenRepository, StoredRefreshToken } from '../../ports/refresh-token.repository.js';

/**
 * In-memory adapter for tests and local experiments. Mirrors the database
 * adapters' semantics, including the atomic single-claim guarantee.
 */
export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly tokens = new Map<string, StoredRefreshToken>();

  store(userId: string, token: { jti: string; hash: string; expiresAt: Date }): Promise<void> {
    this.tokens.set(token.jti, { userId, ...token, revoked: false });
    return Promise.resolve();
  }

  findByJti(jti: string): Promise<StoredRefreshToken | null> {
    const token = this.tokens.get(jti);
    return Promise.resolve(token ? { ...token } : null);
  }

  claim(jti: string): Promise<StoredRefreshToken | null> {
    const token = this.tokens.get(jti);
    if (!token || token.revoked) return Promise.resolve(null);
    token.revoked = true;
    return Promise.resolve({ ...token });
  }

  revokeAllForUser(userId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.userId === userId) token.revoked = true;
    }
    return Promise.resolve();
  }

  deleteExpiredAndRevoked(): Promise<number> {
    const now = new Date();
    let removed = 0;
    for (const [jti, token] of this.tokens) {
      if (token.revoked || token.expiresAt < now) {
        this.tokens.delete(jti);
        removed++;
      }
    }
    return Promise.resolve(removed);
  }
}
