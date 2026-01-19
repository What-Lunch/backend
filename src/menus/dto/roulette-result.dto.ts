import { IsArray, IsNotEmpty, IsString, IsMongoId, ArrayMinSize } from 'class-validator';
import { RouletteMenuResponseDto } from './roulette-menu.dto';

// TODO: rooId 웹소켓 연결 후 변경 필요
export class RouletteResultDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @IsNotEmpty()
  participantId: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty()
  resultMenu: RouletteMenuResponseDto[];
}
