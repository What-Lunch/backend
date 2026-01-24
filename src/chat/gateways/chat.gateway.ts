import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { MenuCategory } from '../../menus/enum/menu-category.enum';
import { MenuContext } from '../../menus/enum/menu-context.enum';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/service/auth.service';
import { MenusService } from '../../menus/service/menus.service';
import { RouletteMenuResponseDto } from '../../menus/dto/roulette-menu.dto';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    nickname: string;
    profileImage?: string;
  };
}

@Injectable()
@WebSocketGateway({
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: {
    origin: ['http://localhost:3000', 'https://whatlunch.vercel.app'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private roomStates: Map<
    string,
    {
      activeTab: string;
      isSpinning: boolean;
      rotation: number;
      result: any;
      startedBy: string | null;
      menus: RouletteMenuResponseDto[]; // 현재 방의 메뉴 목록 (모든 클라이언트 동기화)
      hostId?: string;
    }
  > = new Map();

  constructor(
    private authService: AuthService,
    private menusService: MenusService,
  ) {}

  // ============ 연결 ============
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = (client.handshake.auth as { token?: string })?.token;

      if (!token) {
        client.emit('joinError', { reason: 'NO_TOKEN' });
        client.disconnect();
        return;
      }

      // 토큰 검증
      const user = await this.authService.verifyToken(token);

      if (!user) {
        client.emit('joinError', { reason: 'INVALID_TOKEN' });
        client.disconnect();
        return;
      }

      // 사용자 정보 저장
      client.user = {
        ...user,
        profileImage: user.profileImage ?? undefined,
      };

      // 연결 성공 알림
      client.emit('connected', {
        message: '연결 성공',
        clientId: client.id,
        user: user,
      });
    } catch (error) {
      console.error('[Gateway] 연결 오류:', error);
      client.emit('joinError', { reason: 'CONNECTION_ERROR' });
      client.disconnect();
    }
  }

  // ============ 연결 해제 ============
  handleDisconnect(client: AuthenticatedSocket): void {
    try {
      const user = client.user;
      if (!user) return;
      client.rooms.forEach((roomCode) => {
        if (roomCode !== client.id) {
          client.to(roomCode).emit('userLeft', {
            userId: user.id,
            userEmail: user.email,
            clientId: client.id,
            roomCode: roomCode,
          });
        }
      });
    } catch (error) {
      console.error('[Gateway] 연결 해제 오류:', error);
    }
  }

  // ============ 방 입장 ============
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; role?: string },
  ): Promise<void> {
    try {
      const user = client.user;

      if (!user) {
        client.emit('joinError', { reason: 'UNAUTHORIZED' });
        return;
      }

      // 방에 입장
      await client.join(payload.roomCode);

      // 방 상태 초기화
      if (!this.roomStates.has(payload.roomCode)) {
        // 초기 메뉴 로드 (전체 메뉴)
        const initialMenus = await this.menusService.getMenusByFilters({});
        this.roomStates.set(payload.roomCode, {
          activeTab: 'roulette',
          isSpinning: false,
          rotation: 0,
          result: null,
          startedBy: null,
          menus: initialMenus,
        });
      }

      // 다른 사용자들에게 알림
      client.to(payload.roomCode).emit('userJoined', {
        userId: user.id,
        userEmail: user.email,
        clientId: client.id,
        roomCode: payload.roomCode,
      });

      // 호스트 관리: 방 상태에 hostId 저장
      const roomState = this.roomStates.get(payload.roomCode);
      const isFirstUser = this.server.sockets.adapter.rooms.get(payload.roomCode)?.size === 1;
      let role = isFirstUser ? 'host' : 'guest';
      if (roomState && !roomState.hostId) {
        // 최초 입장자 또는 호스트가 없는 경우
        roomState.hostId = user.id;
        role = 'host';
      }
      // 클라이언트가 host로 재접속 요청 시
      if (payload.role === 'host' && roomState && roomState.hostId === user.id) {
        role = 'host';
      }
      // 방 상태에 저장
      if (roomState) {
        roomState.hostId = roomState.hostId || (role === 'host' ? user.id : undefined);
      }
      client.emit('roleAssigned', {
        role,
        roomCode: payload.roomCode,
        clientId: client.id,
        user,
        menus: roomState?.menus || [], // 메뉴 포함
      });
    } catch (error) {
      console.error('[Gateway] joinRoom 오류:', error);
      client.emit('joinError', { reason: 'JOIN_FAILED' });
      try {
        const user = client.user;
        if (!user) return;
        client.rooms.forEach((roomCode) => {
          if (roomCode !== client.id) {
            // 호스트가 나가면 방의 다른 유저 중 한 명을 호스트로 재할당
            const roomState = this.roomStates.get(roomCode);
            if (roomState && roomState.hostId === user.id) {
              // 방에 남은 유저 중 한 명을 호스트로 지정
              const room = this.server.sockets.adapter.rooms.get(roomCode);
              if (room && room.size > 1) {
                for (const socketId of room) {
                  if (socketId !== client.id) {
                    const nextSocket = this.server.sockets.sockets.get(socketId);
                    if (nextSocket && (nextSocket as any).user) {
                      roomState.hostId = user.id;
                      // 새 호스트에게 roleAssigned emit
                      (nextSocket as any).emit('roleAssigned', {
                        role: 'host',
                        roomCode,
                        clientId: socketId,
                        user: user,
                        menus: roomState.menus || [],
                      });
                      break;
                    }
                  }
                }
              } else {
                // 방에 아무도 없으면 hostId 제거
                roomState.hostId = undefined;
              }
            }
            client.to(roomCode).emit('userLeft', {
              userId: user.id,
              userEmail: user.email,
              clientId: client.id,
              roomCode: roomCode,
            });
          }
        });
      } catch (error) {
        console.error('[Gateway] 연결 해제 오류:', error);
      }

      const roomState = this.roomStates.get(payload.roomCode) || {
        activeTab: 'roulette',
        isSpinning: false,
        rotation: 0,
        result: null,
        startedBy: null,
      };

      client.emit('rouletteStateSync', { state: roomState });
    }
  }

  // ============ 탭 변경 ============
  @SubscribeMessage('tabChange')
  handleTabChange(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; tab: string },
  ): void {
    try {
      const user = client.user;
      if (!user) return;

      // 방 상태 업데이트
      const roomState = this.roomStates.get(payload.roomCode);
      if (roomState) {
        roomState.activeTab = payload.tab;
      }

      // 같은 방의 모든 사용자에게 전파
      this.server.to(payload.roomCode).emit('tabSync', { activeTab: payload.tab });
    } catch (error) {
      console.error('[Gateway] tabChange 오류:', error);
    }
  }

  // ============ 룰렛 회전 ============
  @SubscribeMessage('spinRoulette')
  handleSpinRoulette(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; filters?: any },
  ): void {
    try {
      const user = client.user;
      if (!user) return;

      // 방의 현재 메뉴 목록 사용 (모든 클라이언트와 동기화된 상태)
      const roomState = this.roomStates.get(payload.roomCode);
      const menus = roomState?.menus || [];

      if (menus.length === 0) {
        client.emit('spinError', { reason: 'NO_MENUS' });
        return;
      }

      // 랜덤 메뉴 선택
      const randomIndex = Math.floor(Math.random() * menus.length);
      const randomMenu = menus[randomIndex];

      // 회전 각도: 8~12바퀴 + 해당 메뉴 위치
      const baseRotation = Math.PI * 2 * (8 + Math.random() * 4); // radian
      const step = (Math.PI * 2) / menus.length;
      const itemAngle = step * randomIndex;
      const finalRotation = baseRotation + itemAngle;
      const duration = 5000; // 5초

      // 방 상태 업데이트
      if (roomState) {
        roomState.isSpinning = true;
        roomState.rotation = finalRotation;
        roomState.result = randomMenu;
        roomState.startedBy = user.id;
      }

      // 모든 사용자에게 id 기반 결과 emit (오직 1회만)
      this.server.to(payload.roomCode).emit('rouletteSpin', {
        menus,
        resultMenuId: randomMenu.id,
        finalRotation,
        duration,
      });

      // 회전 완료 후 결과 전송 (기록/통계용, 클라이언트에서는 무시)
      setTimeout(() => {
        if (roomState) {
          roomState.isSpinning = false;
        }
        // 클라이언트에서는 이 이벤트로 모달을 띄우지 않음
        this.server.to(payload.roomCode).emit('rouletteResult', {
          result: randomMenu,
          timestamp: new Date().toISOString(),
        });
      }, duration);
    } catch (error) {
      console.error('[Gateway] spinRoulette 오류:', error);
      client.emit('spinError', { reason: 'SPIN_FAILED' });
    }
  }

  // ============ 필터 업데이트 ============
  @SubscribeMessage('updateRouletteFilters')
  async handleUpdateRouletteFilters(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: {
      roomCode: string;
      filters: { category?: any[]; context?: any[] };
      mode: 'category' | 'context';
      selectedFoodTypes: string | null;
      selectedSituation: string | null;
    },
  ): Promise<void> {
    try {
      const user = client.user;
      if (!user) return;

      // 서버에서 필터에 맞는 메뉴 로드
      // MenuCategory/MenuContext enum import

      function toEnumArr<T extends string>(
        arr: unknown,
        EnumObj: Record<string, T>,
      ): T[] | undefined {
        if (!Array.isArray(arr)) return undefined;
        return arr.map((v) => EnumObj[v as keyof typeof EnumObj]).filter(Boolean);
      }
      const safeFilters: { category?: MenuCategory[]; context?: MenuContext[] } = {
        category: toEnumArr<MenuCategory>(payload.filters?.category, MenuCategory),
        context: toEnumArr<MenuContext>(payload.filters?.context, MenuContext),
      };
      const menus = await this.menusService.getMenusByFilters(safeFilters);
      const menuList = menus.slice(0, 6); // 최대 6개

      // 방 상태에 저장
      const roomState = this.roomStates.get(payload.roomCode);
      if (roomState) {
        roomState.menus = menuList;
      }

      // 모든 사용자에게 전파 (호스트 포함)
      this.server.to(payload.roomCode).emit('rouletteFiltersUpdated', {
        filters: payload.filters,
        mode: payload.mode,
        selectedFoodTypes: payload.selectedFoodTypes,
        selectedSituation: payload.selectedSituation,
        updatedBy: user.id,
        menus: menuList, // 메뉴 목록 포함
      });
    } catch (error) {
      console.error('[Gateway] updateRouletteFilters 오류:', error);
    }
  }

  // ============ 채팅 메시지 ============
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; message: string },
  ): void {
    try {
      const user = client.user;
      if (!user) return;

      // 보낸 사람 제외하고 방의 다른 사람들에게만 전송
      client.to(payload.roomCode).emit('messageReceived', {
        userId: user.id,
        userEmail: user.email,
        userName: user.nickname,
        message: payload.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Gateway] sendMessage 오류:', error);
    }
  }
}
