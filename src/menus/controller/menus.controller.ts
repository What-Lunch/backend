import { Controller, Get, Query } from '@nestjs/common';

import { MenusService } from '../service/menus.service';
import { RouletteMenuDto } from '../dto/roulette-menu.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('roulette')
  async roulette(@Query() query: RouletteMenuDto) {
    return this.menusService.getRouletteMenu(query);
  }
}
