import { Controller, Get, Query, Post, Body } from '@nestjs/common';

import { MenusService } from '../service/menus.service';
import { RouletteMenuDto } from '../dto/roulette-menu.dto';
import { RouletteResultDto } from '../dto/roulette-result.dto';
import { RoomIdParamDto } from '../dto/room-id.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ============ 룰렛 메뉴 조회 (필터 없음 - 최대 20개) ============
  @Get()
  async getAllMenus(@Query('roomId') roomId?: string, @Query('limit') limit: string = '20') {
    console.log('[MenusController] GET /menus:', { roomId, limit });

    // roomId는 참고용, 실제로는 모든 메뉴 반환
    const menus = await this.menusService.getRouletteMenu({
      limit: Math.min(parseInt(limit) || 20, 100),
    });

    return {
      data: menus,
      count: menus.length,
    };
  }

  // ============ 룰렛 메뉴 조회 (필터 포함) ============
  @Get('roulette')
  async roulette(@Query() query: RouletteMenuDto) {
    console.log('[MenusController] GET /menus/roulette:', query);

    const menus = await this.menusService.getRouletteMenu(query);

    return {
      data: menus,
      count: menus.length,
    };
  }

  // ============ 룰렛 결과 저장 ============
  @Post('roulette-result')
  async saveRouletteResult(@Body() body: RouletteResultDto) {
    console.log('[MenusController] POST /menus/roulette-result:', body);

    const result = await this.menusService.saveRouletteResult(body);

    return {
      success: true,
      data: result,
    };
  }

  // ============ 방의 모든 결과 조회 ============
  @Get('roulette-result')
  async getRouletteResultsByRoomId(@Query() query: RoomIdParamDto) {
    console.log('[MenusController] GET /menus/roulette-result:', query);

    const results = await this.menusService.getRouletteResultsByRoomId(query.roomId);

    return {
      data: results,
      count: results.length,
    };
  }
}
