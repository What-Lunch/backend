import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ChatService } from '../chat.service';

const ROOM_CODE_LENGTH = 6;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
};

@Controller('rooms')
export class RoomsController {
  constructor(private readonly chatService: ChatService) {}

  // 방 생성
  @Post()
  createRoom() {
    let roomCode = generateRoomCode();

    while (this.chatService.getRoom(roomCode)) {
      roomCode = generateRoomCode();
    }

    return { roomCode };
  }

  // 방 여부
  @Get(':roomCode')
  checkRoom(@Param('roomCode') roomCode: string) {
    const room = this.chatService.getRoom(roomCode);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return { valid: true };
  }
}
