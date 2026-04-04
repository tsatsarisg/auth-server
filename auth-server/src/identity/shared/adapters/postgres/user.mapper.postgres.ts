import { User } from '../../user.aggregate.js';
import { type UserRecord, type NewUserRecord } from './schema/user.schema.js';

export class UserPostgresMapper {
  static toDomain(record: UserRecord): User {
    return User.reconstitute({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      isEmailVerified: record.isEmailVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(user: User): NewUserRecord {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
