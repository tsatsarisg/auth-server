import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { RefreshTokenRepository, StoredRefreshToken } from '../../ports/refresh-token.repository.js';
import { type RefreshTokenDocument, type RefreshTokenMongoDocument } from './schemas/refresh-token.schema.js';

@Injectable()
export class RefreshTokenMongoRepository implements RefreshTokenRepository {
  constructor(@InjectModel('RefreshToken') private readonly tokenModel: Model<RefreshTokenMongoDocument>) {}

  async store(userId: string, token: { jti: string; hash: string; expiresAt: Date }): Promise<void> {
    await this.tokenModel.create({
      userId,
      jti: token.jti,
      hash: token.hash,
      expiresAt: token.expiresAt,
      revoked: false,
    });
  }

  async findByJti(jti: string): Promise<StoredRefreshToken | null> {
    const doc = await this.tokenModel.findOne({ jti }).exec();
    if (!doc) return null;
    return this.toStored(doc);
  }

  async claim(jti: string): Promise<StoredRefreshToken | null> {
    // findOneAndUpdate is atomic per document: of two concurrent claims for
    // the same jti, only one matches revoked=false; the loser gets null.
    const doc = await this.tokenModel
      .findOneAndUpdate({ jti, revoked: false }, { $set: { revoked: true } }, { new: false })
      .exec();
    if (!doc) return null;
    return { ...this.toStored(doc), revoked: true };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.tokenModel.updateMany({ userId }, { $set: { revoked: true } }).exec();
  }

  async deleteExpiredAndRevoked(): Promise<number> {
    const result = await this.tokenModel
      .deleteMany({ $or: [{ revoked: true }, { expiresAt: { $lt: new Date() } }] })
      .exec();
    return result.deletedCount;
  }

  private toStored(doc: RefreshTokenDocument): StoredRefreshToken {
    return {
      userId: doc.userId,
      jti: doc.jti,
      hash: doc.hash,
      expiresAt: doc.expiresAt,
      revoked: doc.revoked,
    };
  }
}
