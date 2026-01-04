import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Provider } from 'src/common/enum/provider.enum';

@Schema({ timestamps: true })
export class Account {
  @Prop({ maxlength: 100 })
  accountName?: string;

  @Prop({ required: true, unique: true, maxlength: 255 })
  email: string;

  @Prop()
  password?: string;

  @Prop({ enum: Provider })
  provider: Provider;

  @Prop()
  providerId?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export type AccountDocument = Account & Document;

export const AccountSchema = SchemaFactory.createForClass(Account);
