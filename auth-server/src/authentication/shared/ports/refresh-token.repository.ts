export interface StoredRefreshToken {
  userId: string;
  jti: string;
  hash: string;
  expiresAt: Date;
  revoked?: boolean;
}

export interface RefreshTokenRepository {
  store(userId: string, token: { jti: string; hash: string; expiresAt: Date }): Promise<void>;
  findByJti(jti: string): Promise<StoredRefreshToken | null>;
  /**
   * Atomically revoke the token iff it is still active (compare-and-swap).
   * Returns the token when this call won the claim; null when the jti is
   * unknown or was already revoked — callers must treat the latter as a
   * possible replay, never retry the claim.
   */
  claim(jti: string): Promise<StoredRefreshToken | null>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpiredAndRevoked(): Promise<number>;
}

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';
