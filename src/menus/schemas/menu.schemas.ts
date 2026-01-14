import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { MenuCategory } from '../enum/menu-category.enum';
import { MenuContext } from '../enum/menu-context.enum';
import { Types } from 'mongoose';

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
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

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
