import { Controller, Get, Query, Post, Body } from '@nestjs/common';

import { MenusService } from '../service/menus.service';
import { RouletteMenuDto } from '../dto/roulette-menu.dto';
import { RouletteResultDto } from '../dto/roulette-result.dto';
import { RoomIdParamDto } from '../dto/room-id.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // 룰렛 메뉴 조회
  @Get('roulette')
  async roulette(@Query() query: RouletteMenuDto) {
    return this.menusService.getRouletteMenu(query);
  }

  // 룰렛 결과 저장
  @Post('roulette-result')
  async saveRouletteResult(@Body() body: RouletteResultDto) {
    return this.menusService.saveRouletteResult(body);
  }

  // TODO: 웹소켓 연결 후 수정
  // 방의 모든 결과 조회 (친구들과 공유용)
  @Get('roulette-result')
  getRouletteResultsByRoomId(@Query() query: RoomIdParamDto) {
    return this.menusService.getRouletteResultsByRoomId(query.roomId);
  }
}
