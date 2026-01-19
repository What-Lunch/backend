import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';

import { MenusService } from '../service/menus.service';
import { RouletteMenuDto } from '../dto/roulette-menu.dto';
import { RouletteResultDto } from '../dto/roulette-result.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('roulette')
  async roulette(@Query() query: RouletteMenuDto) {
    return this.menusService.getRouletteMenu(query);
  }

  @Post('roulette-result')
  async rouletteResult(@Body() body: RouletteResultDto) {
    return this.menusService.saveRouletteResult(body);
  }

  @Get('roulette-result/:id')
  async getRouletteResult(@Param('roomId') roomId: string) {
    return this.menusService.getRouletteResultById(roomId);
  }
}
