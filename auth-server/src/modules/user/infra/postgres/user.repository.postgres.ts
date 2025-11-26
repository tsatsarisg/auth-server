import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import User from '../../domain/user.entity';
import UserRepository from '../../domain/user.repository.interface';
import { UserPostgresMapper } from './user.mapper.postgres';
import { users, refreshTokens } from './schema';
import { DRIZZLE_DB } from '../../../../database/drizzle.provider';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import Encryptor from 'src/modules/encryptor/encryptor';

@Injectable()
export default class UserPostgresRepository implements UserRepository {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly encryptor: Encryptor,
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id));

    if (result.length === 0) return null;

    const record = result[0];
    if (record.passwordHash) {
      record.passwordHash = this.encryptor.decrypt(record.passwordHash);
    }

    return UserPostgresMapper.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (result.length === 0) return null;

    const record = result[0];
    if (record.passwordHash) {
      record.passwordHash = this.encryptor.decrypt(record.passwordHash);
    }

    return UserPostgresMapper.toDomain(record);
  }

  async create(user: User): Promise<void> {
    const data = UserPostgresMapper.toPersistence(user);

    if (data.passwordHash) {
      data.passwordHash = this.encryptor.encrypt(data.passwordHash);
    }

    await this.db.insert(users).values(data);
  }

  async update(user: User): Promise<void> {
    const data = UserPostgresMapper.toPersistence(user);

    await this.db
      .update(users)
      .set({
        email: data.email,
        passwordHash: data.passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async storeRefreshToken(
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

  async findRefreshTokenByJti(jti: string): Promise<{
    userId: string;
    jti: string;
    hash: string;
    expiresAt: Date;
    revoked?: boolean;
  } | null> {
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

  async revokeRefreshToken(jti: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.jti, jti));
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }
}
