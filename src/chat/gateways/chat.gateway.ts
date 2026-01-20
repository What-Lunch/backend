import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat.service';
import { AuthService } from '../../auth/service/auth.service';

interface SocketUser {
  id: string;
  nickname: string;
}

interface SocketData {
  user: SocketUser;
  role: 'host' | 'guest';
}

type TypedSocket = Socket & { data: SocketData };

interface JoinRoomPayload {
  roomCode: string;
}

interface SendMessagePayload {
  roomCode: string;
  message: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8080', 'https://whatlunch.vercel.app'],
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const socket = client as TypedSocket;

    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('NO_TOKEN');
      }

      const user = await this.authService.verifyAccessToken(token);

      socket.data.user = {
        id: user._id.toString(),
        nickname: user.nickname,
      };
    } catch {
      socket.disconnect();
    }
  }

  // 방 입장
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomPayload) {
    const socket = client as TypedSocket;
    const user = socket.data.user as SocketUser | undefined;
    if (!user) return;

    const { roomCode } = payload;

    if (socket.rooms.has(roomCode)) {
      return;
    }

    const result = this.chatService.joinRoom(roomCode, user);
    if (!result) {
      socket.emit('joinError', { reason: 'ROOM_NOT_FOUND' });
      return;
    }

    const { room, isHost } = result;
    socket.data.role = isHost ? 'host' : 'guest';

    await socket.join(roomCode);

    this.server.to(roomCode).emit('roomUsers', room.users);

    socket.to(roomCode).emit('systemMessage', {
      message: `${user.nickname} 님이 입장했습니다.`,
    });

    const role: 'host' | 'guest' = isHost ? 'host' : 'guest';
    socket.data.role = role;

    socket.emit('roleAssigned', { role });
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessagePayload) {
    const socket = client as TypedSocket;
    const user = socket.data.user as SocketUser | undefined;
    if (!user) return;

    const { roomCode, message } = payload;

    const result = this.chatService.handleMessage(message);

    socket.to(roomCode).emit('receiveMessage', {
      sender: user.nickname,
      ...result,
    });
  }

  handleDisconnect(client: Socket) {
    const socket = client as TypedSocket;
    const user = socket.data.user as SocketUser | undefined;
    if (!user) return;

    const joinedRooms: string[] = [...socket.rooms];

    joinedRooms.forEach((roomCode) => {
      // 자신의 socket id는 제외
      if (roomCode === socket.id) return;

      const result = this.chatService.leaveRoom(roomCode, user.id);

      if (result?.closed) {
        // 방장 퇴장 → 방 종료
        this.server.to(roomCode).emit('roomClosed');
        void this.server.socketsLeave(roomCode);
      } else {
        // 일반 유저 퇴장
        socket.to(roomCode).emit('systemMessage', {
          message: `${user.nickname} 님이 퇴장했습니다.`,
        });
      }
    });
  }
}
