import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class UserFavorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Menu', required: true })
  menuId: Types.ObjectId;
}

export const UserFavoriteSchema = SchemaFactory.createForClass(UserFavorite);

// 같은 메뉴 중복 찜 방지
UserFavoriteSchema.index({ userId: 1, menuId: 1 }, { unique: true });
