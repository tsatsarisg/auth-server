import User from '../../domain/user.entity';
import { UserRecord, NewUserRecord } from './schema/user.schema';

export class UserPostgresMapper {
  static toDomain(record: UserRecord): User {
    return new User(record.id, record.email, record.passwordHash);
  }

  static toPersistence(user: User): NewUserRecord {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }
}
