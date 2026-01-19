import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RouletteMenuResponseDto } from '../dto/roulette-menu.dto';

export type RouletteResultDocument = RouletteResult & Document;

@Schema({ timestamps: true })
export class RouletteResult {
  @Prop({ required: true })
  roomId: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participantId: Types.ObjectId[];

  @Prop({ type: Array, required: true })
  resultMenu: RouletteMenuResponseDto[];
}

export const RouletteResultSchema = SchemaFactory.createForClass(RouletteResult);
