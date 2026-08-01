import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User } from '../../user.aggregate.js';
import { UserRepository, EmailAlreadyInUseError } from '../../ports/user.repository.js';
import { UserPostgresMapper } from './user.mapper.postgres.js';
import { users } from './schema/index.js';
import { DRIZZLE_DB } from '../../../../database/drizzle.provider.js';
import type { DrizzleDB } from '../../../../database/drizzle.provider.js';

const PG_UNIQUE_VIOLATION = '23505';

// Drizzle may wrap the driver error (DrizzleQueryError with `cause`), so walk
// the cause chain looking for the Postgres error code.
function isUniqueViolation(e: unknown): boolean {
  for (let cause: unknown = e; cause instanceof Error; cause = cause.cause) {
    if ((cause as { code?: unknown }).code === PG_UNIQUE_VIOLATION) return true;
  }
  return false;
}

@Injectable()
export class UserPostgresRepository implements UserRepository {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDB,
    private readonly mapper: UserPostgresMapper,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.email, email));

    const record = result[0];
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async create(user: User): Promise<void> {
    try {
      await this.db.insert(users).values(this.mapper.toPersistence(user));
    } catch (e) {
      if (isUniqueViolation(e)) throw new EmailAlreadyInUseError();
      throw e;
    }
  }
}
