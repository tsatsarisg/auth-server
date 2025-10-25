import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({ timestamps: true })
export class UserDocument {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  passwordHash: string;
}

export type UserMongoDocument = UserDocument & Document & { _id: string };

export const UserSchema = SchemaFactory.createForClass(UserDocument);
