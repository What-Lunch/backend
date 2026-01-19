import { Controller, Get, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { ChatService } from '../chat.service';

const ROOM_CODE_LENGTH = 6;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_ROOM_CODE_ATTEMPTS = 10;

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
    const MAX_ATTEMPTS = 10;
    let roomCode: string | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidate = generateRoomCode();

      if (!this.chatService.getRoom(candidate)) {
        roomCode = candidate;
        break;
      }
    }

    if (!roomCode) {
      throw new Error('ROOM_CODE_GENERATION_FAILED');
    }

    // 호스트로 방 생성
    this.chatService.createRoom(roomCode, {
      id: 'temp-host',
      nickname: 'HOST',
    });

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
