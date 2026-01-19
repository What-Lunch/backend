import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';

import { MenusService } from '../service/menus.service';
import { RouletteMenuDto } from '../dto/roulette-menu.dto';
import { RouletteResultDto } from '../dto/roulette-result.dto';

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

  // 방의 모든 결과 조회 (친구들과 공유용)
  @Get('roulette-result/:roomId')
  getRouletteResultsByRoomId(@Param('roomId') roomId: string) {
    return this.menusService.getRouletteResultsByRoomId(roomId);
  }
}
