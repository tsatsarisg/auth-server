import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({ timestamps: true })
export class UserDocument {
  @Prop({ type: String, default: () => randomUUID() })
  _id!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop()
  passwordHash!: string;

  @Prop({ type: Boolean, default: false })
  isEmailVerified!: boolean;

  @Prop({ type: Array, default: [] })
  refreshTokens?: Array<{
    jti: string;
    hash: string;
    expiresAt: Date;
    revoked?: boolean;
    createdAt?: Date;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserMongoDocument = HydratedDocument<UserDocument>;

export const UserSchema = SchemaFactory.createForClass(UserDocument);
