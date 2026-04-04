import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User } from '../../user.aggregate.js';
import { UserRepository } from '../../ports/user.repository.js';
import { UserPostgresMapper } from './user.mapper.postgres.js';
import { users } from './schema/index.js';
import { DRIZZLE_DB } from '../../../../database/drizzle.provider.js';
import type { DrizzleDB } from '../../../../database/drizzle.provider.js';
import { Encryptor } from '../../../../encryption/encryptor.js';

@Injectable()
export class UserPostgresRepository implements UserRepository {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly encryptor: Encryptor,
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id));

    if (result.length === 0) return null;

    const record = result[0];
    if (!record) return null;
    if (record.passwordHash) {
      record.passwordHash = this.encryptor.decrypt(record.passwordHash);
    }

    return UserPostgresMapper.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.email, email));

    if (result.length === 0) return null;

    const record = result[0];
    if (!record) return null;
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

    let passwordHash = data.passwordHash;
    if (passwordHash) {
      passwordHash = this.encryptor.encrypt(passwordHash);
    }

    await this.db
      .update(users)
      .set({
        email: data.email,
        passwordHash,
        isEmailVerified: data.isEmailVerified,
        updatedAt: user.updatedAt,
      })
      .where(eq(users.id, user.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
