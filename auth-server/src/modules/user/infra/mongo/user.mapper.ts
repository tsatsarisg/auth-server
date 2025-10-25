import User from '../../domain/user.entity';
import { UserMongoDocument } from './schemas/user.schema';

export class UserMapper {
  static toDomain(raw: UserMongoDocument): User {
    return new User(raw._id, raw.email, raw.passwordHash);
  }

  static toPersistence(user: User): Partial<UserMongoDocument> {
    return {
      _id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }
}
