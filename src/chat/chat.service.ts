import { Injectable } from '@nestjs/common';

interface RoomUser {
  id: string;
  nickname: string;
}

interface Room {
  hostId: string;
  users: RoomUser[];
  createdAt: Date;
}

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

  // 유저 입장
  joinRoom(roomCode: string, user: RoomUser): { room: Room; isHost: boolean } {
    let room = this.rooms.get(roomCode);

    if (!room) {
      room = {
        hostId: user.id,
        users: [user],
        createdAt: new Date(),
      };
      this.rooms.set(roomCode, room);
      return { room, isHost: true };
    }

    if (!room.users.find((u) => u.id === user.id)) {
      room.users.push(user);
    }

    return { room, isHost: room.hostId === user.id };
  }

  leaveRoom(roomCode: string, userId: string): { closed: boolean; room?: Room } | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.users = room.users.filter((u) => u.id !== userId);

    if (room.hostId === userId) {
      this.rooms.delete(roomCode);
      return { closed: true };
    }

    return { closed: false, room };
  }

  handleMessage(message: string): { message: string; createdAt: Date } {
    return {
      message,
      createdAt: new Date(),
    };
  }
}
