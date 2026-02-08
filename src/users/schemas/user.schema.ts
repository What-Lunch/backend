import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: false, default: null })
  passwordHash?: string | null;

  @Prop({ required: true, trim: true })
  nickname!: string;

  @Prop({ type: String, default: null })
  profileImage!: string | null;

  @Prop({ type: [String], default: [] })
  selectedFoodDotIds!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
