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

  async storeRefreshToken(
    userId: string,
    token: { jti: string; hash: string; expiresAt: Date },
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: {
            refreshTokens: {
              jti: token.jti,
              hash: token.hash,
              expiresAt: token.expiresAt,
              revoked: false,
              createdAt: new Date(),
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async findRefreshTokenByJti(jti: string): Promise<{
    userId: string;
    jti: string;
    hash: string;
    expiresAt: Date;
    revoked?: boolean;
  } | null> {
    const doc = await this.userModel
      .findOne({ 'refreshTokens.jti': jti }, { 'refreshTokens.$': 1 })
      .exec();
    if (!doc || !doc.refreshTokens || doc.refreshTokens.length === 0)
      return null;
    const rt = doc.refreshTokens[0];
    return {
      userId: String(doc._id),
      jti: rt.jti,
      hash: rt.hash,
      expiresAt: rt.expiresAt,
      revoked: rt.revoked,
    };
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    await this.userModel
      .updateOne(
        { 'refreshTokens.jti': jti },
        { $set: { 'refreshTokens.$.revoked': true } },
      )
      .exec();
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        { $set: { 'refreshTokens.$[].revoked': true } },
      )
      .exec();
  }
}
