import { IsNotEmpty, IsString } from 'class-validator';

export class RoomIdParamDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
