import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { RouletteMenuResponseDto } from './roulette-menu.dto';

export class RouletteResultDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  participantId: string[];

  @IsArray()
  @IsNotEmpty()
  resultMenu: RouletteMenuResponseDto[];
}
