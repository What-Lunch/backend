import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  roomCode?: string;

  @IsString()
  message: string;
}
