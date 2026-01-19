import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Menu } from './menu.schemas';

export const ResultMenuSchema = SchemaFactory.createForClass(Menu);

export type RouletteResultDocument = RouletteResult & Document;

@Schema({ timestamps: true })
export class RouletteResult {
  @Prop({ required: true })
  roomId: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participantId: Types.ObjectId[];

  @Prop({ type: [ResultMenuSchema], required: true })
  resultMenu: Menu[];
}

export const RouletteResultSchema = SchemaFactory.createForClass(RouletteResult);
