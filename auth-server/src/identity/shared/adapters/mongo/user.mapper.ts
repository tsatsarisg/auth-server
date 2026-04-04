import { User } from '../../user.aggregate.js';
import { UserMongoDocument } from './schemas/user.schema.js';

export class UserMapper {
  static toDomain(raw: UserMongoDocument): User {
    return User.reconstitute({
      id: raw._id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      isEmailVerified: raw.isEmailVerified ?? false,
      createdAt: raw.createdAt ?? new Date(),
      updatedAt: raw.updatedAt ?? new Date(),
    });
  }

  static toPersistence(
    user: User,
  ): Partial<UserMongoDocument> {
    return {
      _id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
