import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../domain/refresh-token.repository.interface';
import type { UserMongoDocument } from '../../../user/infra/mongo/schemas/user.schema';

@Injectable()
export default class RefreshTokenMongoRepository
  implements RefreshTokenRepository
{
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserMongoDocument>,
  ) {}

  async store(
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

  async findByJti(jti: string): Promise<StoredRefreshToken | null> {
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

  async revoke(jti: string): Promise<void> {
    await this.userModel
      .updateOne(
        { 'refreshTokens.jti': jti },
        { $set: { 'refreshTokens.$.revoked': true } },
      )
      .exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        { $set: { 'refreshTokens.$[].revoked': true } },
      )
      .exec();
  }
}
