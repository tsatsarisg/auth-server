import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import User from '../../domain/user.entity';
import UserRepository from '../../domain/user.repository.interface';
import { UserMongoDocument } from './schemas/user.schema';
import { UserMapper } from './user.mapper';
import Encryptor from 'src/modules/encryptor/encryptor';

@Injectable()
export default class UserMongoRepository implements UserRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserMongoDocument>,
    private readonly encryptor: Encryptor,
  ) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    if (!doc) return null;
    if (doc.passwordHash) {
      doc.passwordHash = this.encryptor.decrypt(doc.passwordHash);
    }
    return UserMapper.toDomain(doc);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    if (!doc) return null;
    if (doc.passwordHash) {
      doc.passwordHash = this.encryptor.decrypt(doc.passwordHash);
    }
    return UserMapper.toDomain(doc);
  }

  async create(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    if (data.passwordHash) {
      data.passwordHash = this.encryptor.encrypt(data.passwordHash);
    }
    const created = new this.userModel(data);
    await created.save();
  }

  async update(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.userModel.findByIdAndUpdate(user.id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
