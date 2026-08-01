import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user.aggregate.js';
import { UserRepository, EmailAlreadyInUseError } from '../../ports/user.repository.js';
import { UserMongoDocument } from './schemas/user.schema.js';
import { UserMongoMapper } from './user.mapper.js';

const MONGO_DUPLICATE_KEY = 11000;

function isDuplicateKeyError(e: unknown): boolean {
  for (let cause: unknown = e; cause instanceof Error; cause = cause.cause) {
    if ((cause as { code?: unknown }).code === MONGO_DUPLICATE_KEY) return true;
  }
  return false;
}

@Injectable()
export class UserMongoRepository implements UserRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserMongoDocument>,
    private readonly mapper: UserMongoMapper,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    if (!doc) return null;
    return this.mapper.toDomain(doc);
  }

  async create(user: User): Promise<void> {
    const created = new this.userModel(this.mapper.toPersistence(user));
    try {
      await created.save();
    } catch (e) {
      if (isDuplicateKeyError(e)) throw new EmailAlreadyInUseError();
      throw e;
    }
  }
}
