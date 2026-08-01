import { Injectable } from '@nestjs/common';
import { User } from '../../user.aggregate.js';
import { type UserRecord, type NewUserRecord } from './schema/user.schema.js';
import { Encryptor } from '../../../../encryption/encryptor.js';

/**
 * Owns the at-rest encryption policy: domain objects always carry the
 * plaintext scrypt hash, persistence records always carry the encrypted form.
 */
@Injectable()
export class UserPostgresMapper {
  constructor(private readonly encryptor: Encryptor) {}

  toDomain(record: UserRecord): User {
    return User.reconstitute({
      id: record.id,
      email: record.email,
      passwordHash: this.encryptor.decrypt(record.passwordHash),
      isEmailVerified: record.isEmailVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  toPersistence(user: User): NewUserRecord {
    return {
      id: user.id,
      email: user.email,
      passwordHash: this.encryptor.encrypt(user.passwordHash),
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
