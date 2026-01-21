import { Injectable } from '@nestjs/common';

interface RoomUser {
  id: string;
  nickname: string;
}

interface Room {
  hostId: string;
  users: RoomUser[];
  createdAt: Date;
  expireTimer?: NodeJS.Timeout;
}

const ROOM_EXPIRE_MS = 30 * 60 * 1000; // 30분
const MAX_ROOM_USERS = 8; // 최대 인원

@Injectable()
export class ChatService {
  private rooms = new Map<string, Room>();

  // 방 생성
  createRoom(roomCode: string, host: RoomUser): Room {
    const room: Room = {
      hostId: host.id,
      users: [host],
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  // 방 입장
  joinRoom(roomCode: string, user: RoomUser): { room: Room; isHost: boolean } | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // 재입장 여부 확인
    const isAlreadyUser = room.users.some((u) => u.id === user.id);

    // 인원 제한 (신규 유저만)
    if (!isAlreadyUser && room.users.length >= MAX_ROOM_USERS) {
      return null;
    }

    // 재입장 시 만료 타이머 취소
    if (room.expireTimer) {
      clearTimeout(room.expireTimer);
      room.expireTimer = undefined;
    }

    // 첫 실제 유저 host
    if (room.hostId === 'temp-host') {
      room.hostId = user.id;
      // 유령 방장(temp-host)을 유저 목록에서 제거
      room.users = room.users.filter((u) => u.id !== 'temp-host');
    }

    // 유저 추가
    if (!isAlreadyUser) {
      room.users.push(user);
    } else {
      // 이미 있는 유저라면 정보를 최신으로 갱신
      const index = room.users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        room.users[index] = user;
      }
    }

    return {
      room,
      isHost: room.hostId === user.id,
    };
  }

  // 방 퇴장
  leaveRoom(roomCode: string, userId: string): { closed: boolean; room?: Room } | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    room.users = room.users.filter((u) => u.id !== userId);

    // 아무도 없으면 30분 후 방 삭제
    if (room.users.length === 0) {
      room.expireTimer = setTimeout(() => {
        this.rooms.delete(roomCode);
      }, ROOM_EXPIRE_MS);

      return { closed: false, room };
    }

    // host 나가면 다음 유저에게 host 위임
    if (room.hostId === userId) {
      room.hostId = room.users[0].id;
    }

    return { closed: false, room };
  }

  // 메시지 처리 (타임스탬프만 담당)
  handleMessage(message: string) {
    return {
      message,
      createdAt: new Date(),
    };
  }
}
