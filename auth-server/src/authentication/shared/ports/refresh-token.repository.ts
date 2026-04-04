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
  revoke(jti: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpiredAndRevoked(): Promise<number>;
}

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';
