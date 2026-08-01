import { Injectable } from '@nestjs/common';
import { User } from '../../user.aggregate.js';
import { type UserDocument, type UserMongoDocument } from './schemas/user.schema.js';
import { Encryptor } from '../../../../encryption/encryptor.js';

/**
 * Owns the at-rest encryption policy: domain objects always carry the
 * plaintext scrypt hash, persistence documents always carry the encrypted form.
 */
@Injectable()
export class UserMongoMapper {
  constructor(private readonly encryptor: Encryptor) {}

  toDomain(raw: UserMongoDocument): User {
    return User.reconstitute({
      id: raw._id,
      email: raw.email,
      passwordHash: this.encryptor.decrypt(raw.passwordHash),
      isEmailVerified: raw.isEmailVerified ?? false,
      createdAt: raw.createdAt ?? new Date(),
      updatedAt: raw.updatedAt ?? new Date(),
    });
  }

  toPersistence(user: User): Pick<UserDocument, '_id' | 'email' | 'passwordHash' | 'isEmailVerified'> {
    return {
      _id: user.id,
      email: user.email,
      passwordHash: this.encryptor.encrypt(user.passwordHash),
      isEmailVerified: user.isEmailVerified,
    };
  }
}
