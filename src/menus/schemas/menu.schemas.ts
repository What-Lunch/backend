import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { MenuCategory } from '../enum/menu-category.enum';
import { MenuContext } from '../enum/menu-context.enum';

@Schema({ timestamps: true })
export class Menu extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(MenuCategory),
    required: true,
  })
  category: MenuCategory;

  @Prop({
    type: [String],
    enum: Object.values(MenuContext),
    default: [],
  })
  contexts: MenuContext[];

  @Prop({ default: false })
  isBest: boolean;

  @Prop()
  calorie?: number;

  // 찜 수 (Top3 캐러셀 기준)
  @Prop({ type: Number, default: 0, min: 0 })
  favoriteCount!: number;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

export type MenuDocument = Menu & Document;

MenuSchema.index({ favoriteCount: -1 });

MenuSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Menu & { _id: Types.ObjectId }) => {
    const { _id, ...rest } = ret;

    return {
      id: _id.toString(),
      ...rest,
    };
  },
});
