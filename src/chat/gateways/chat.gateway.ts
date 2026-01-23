import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/service/auth.service';
import { MenusService } from '../../menus/service/menus.service';

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
      menus: any[]; // 현재 방의 메뉴 목록 (모든 클라이언트 동기화)
    }
  > = new Map();

  constructor(
    private authService: AuthService,
    private menusService: MenusService,
  ) {}

  // ============ 연결 ============
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;

      console.log('[Gateway] 🔌 새 연결 시도:', {
        clientId: client.id,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'NONE',
      });

      if (!token) {
        console.log('[Gateway] ❌ 토큰 없음:', client.id);
        client.emit('joinError', { reason: 'NO_TOKEN' });
        client.disconnect();
        return;
      }

      // 토큰 검증
      const user = await this.authService.verifyToken(token);

      if (!user) {
        console.log('[Gateway] ❌ 토큰 검증 실패:', client.id);
        client.emit('joinError', { reason: 'INVALID_TOKEN' });
        client.disconnect();
        return;
      }

      // 사용자 정보 저장
      client.user = {
        ...user,
        profileImage: user.profileImage ?? undefined,
      };

      console.log('[Gateway] ✅ 클라이언트 연결 + 사용자 정보 저장:', {
        clientId: client.id,
        userId: user.id,
        userEmail: user.email,
        userStored: !!client.user,
      });

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
    const user = (client as AuthenticatedSocket).user;
    console.log('[Gateway] 🔌 클라이언트 해제:', {
      clientId: client.id,
      userId: user?.id,
    });
  }

  // ============ 방 입장 ============
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ): Promise<void> {
    try {
      const user = client.user;

      console.log('[Gateway] joinRoom 요청:', {
        clientId: client.id,
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        roomCode: payload.roomCode,
      });

      if (!user) {
        console.log('[Gateway] ❌ joinRoom: 사용자 정보 없음 - client.user =', user);
        client.emit('joinError', { reason: 'UNAUTHORIZED' });
        return;
      }

      console.log('[Gateway] joinRoom:', {
        clientId: client.id,
        userId: user.id,
        roomCode: payload.roomCode,
      });

      // 방에 입장
      client.join(payload.roomCode);

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
          menus: initialMenus.slice(0, 6), // 최대 6개
        });
      }

      // 다른 사용자들에게 알림
      client.to(payload.roomCode).emit('userJoined', {
        userId: user.id,
        userEmail: user.email,
        clientId: client.id,
        roomCode: payload.roomCode,
      });

      // 입장자에게 역할 할당 + 메뉴 상태 함께 전송
      const isFirstUser = this.server.sockets.adapter.rooms.get(payload.roomCode)?.size === 1;
      const role = isFirstUser ? 'host' : 'guest';

      const currentState = this.roomStates.get(payload.roomCode);

      client.emit('roleAssigned', {
        role,
        roomCode: payload.roomCode,
        clientId: client.id,
        user,
        menus: currentState?.menus || [], // 메뉴 포함
      });

      console.log('[Gateway] ✅ 방 입장 성공:', {
        roomCode: payload.roomCode,
        role,
        menuCount: currentState?.menus?.length || 0,
      });
    } catch (error) {
      console.error('[Gateway] joinRoom 오류:', error);
      client.emit('joinError', { reason: 'JOIN_FAILED' });
    }
  }

  // ============ 상태 요청 ============
  @SubscribeMessage('requestRouletteState')
  handleRequestRouletteState(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ): void {
    try {
      const user = (client as AuthenticatedSocket).user;

      if (!user) {
        client.emit('joinError', { reason: 'UNAUTHORIZED' });
        return;
      }

      console.log('[Gateway] requestRouletteState:', payload.roomCode);

      const roomState = this.roomStates.get(payload.roomCode) || {
        activeTab: 'roulette',
        isSpinning: false,
        rotation: 0,
        result: null,
        startedBy: null,
      };

      client.emit('rouletteStateSync', { state: roomState });
    } catch (error) {
      console.error('[Gateway] requestRouletteState 오류:', error);
    }
  }

  // ============ 탭 변경 ============
  @SubscribeMessage('tabChange')
  handleTabChange(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; tab: string },
  ): void {
    try {
      const user = (client as AuthenticatedSocket).user;
      if (!user) return;

      console.log('[Gateway] tabChange:', payload);

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
  async handleSpinRoulette(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; filters?: any },
  ): Promise<void> {
    try {
      const user = (client as AuthenticatedSocket).user;
      if (!user) return;

      console.log('[Gateway] spinRoulette:', {
        roomCode: payload.roomCode,
        userId: user.id,
        filters: payload.filters,
      });

      // 방의 현재 메뉴 목록 사용 (모든 클라이언트와 동기화된 상태)
      const roomState = this.roomStates.get(payload.roomCode);
      const menus = roomState?.menus || [];

      if (menus.length === 0) {
        console.log('[Gateway] ❌ 메뉴 없음');
        client.emit('spinError', { reason: 'NO_MENUS' });
        return;
      }

      // 랜덤 메뉴 선택
      const randomIndex = Math.floor(Math.random() * menus.length);
      const randomMenu = menus[randomIndex];

      const rotation = 360 * (8 + Math.random() * 4); // 더 많이 회전 (8~12바퀴)
      const duration = 5000; // 5초로 증가

      // 방 상태 업데이트
      if (roomState) {
        roomState.isSpinning = true;
        roomState.rotation = rotation;
        roomState.result = randomMenu;
        roomState.startedBy = user.id;
      }

      console.log('[Gateway] 룰렛 회전 시작:', {
        roomCode: payload.roomCode,
        menu: randomMenu.name,
        rotation,
        selectedIndex: randomIndex,
      });

      // 같은 방의 모든 사용자에게 전파
      this.server.to(payload.roomCode).emit('rouletteSpinStarted', {
        rotation,
        duration,
        result: randomMenu,
        selectedIndex: randomIndex, // 선택된 메뉴의 인덱스
        startedBy: user.id,
      });

      // 회전 완료 후 결과 전송
      setTimeout(() => {
        if (roomState) {
          roomState.isSpinning = false;
        }

        this.server.to(payload.roomCode).emit('rouletteResult', {
          result: randomMenu,
          timestamp: new Date().toISOString(),
        });

        console.log('[Gateway] 룰렛 결과:', {
          roomCode: payload.roomCode,
          menu: randomMenu.name,
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
      const user = (client as AuthenticatedSocket).user;
      if (!user) return;

      console.log('[Gateway] updateRouletteFilters:', payload);

      // 서버에서 필터에 맞는 메뉴 로드
      const menus = await this.menusService.getMenusByFilters((payload.filters as any) || {});
      const menuList = menus.slice(0, 6); // 최대 6개

      // 방 상태에 저장
      const roomState = this.roomStates.get(payload.roomCode);
      if (roomState) {
        roomState.menus = menuList;
      }

      console.log('[Gateway] 메뉴 동기화:', {
        roomCode: payload.roomCode,
        menuCount: menuList.length,
        menuNames: menuList.map((m) => m.name),
      });

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
      const user = (client as AuthenticatedSocket).user;
      if (!user) return;

      console.log('[Gateway] sendMessage:', {
        roomCode: payload.roomCode,
        userId: user.id,
        message: payload.message,
      });

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
