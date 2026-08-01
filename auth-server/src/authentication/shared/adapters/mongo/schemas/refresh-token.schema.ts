import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

@Schema({ collection: 'refresh_tokens', timestamps: { createdAt: true, updatedAt: false } })
export class RefreshTokenDocument {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, unique: true })
  jti!: string;

  @Prop({ required: true })
  hash!: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Boolean, default: false })
  revoked!: boolean;

  createdAt?: Date;
}

export type RefreshTokenMongoDocument = HydratedDocument<RefreshTokenDocument>;

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenDocument);
