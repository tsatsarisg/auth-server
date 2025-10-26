import User from './user.entity';

export default interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  storeRefreshToken(
    userId: string,
    token: { jti: string; hash: string; expiresAt: Date },
  ): Promise<void>;
  findRefreshTokenByJti(jti: string): Promise<{
    userId: string;
    jti: string;
    hash: string;
    expiresAt: Date;
    revoked?: boolean;
  } | null>;
  revokeRefreshToken(jti: string): Promise<void>;
  revokeAllRefreshTokensForUser(userId: string): Promise<void>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
