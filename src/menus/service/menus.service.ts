import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Menu } from '../schemas/menu.schemas';
import { RouletteMenuDto } from '../dto/roulette-menu.dto';
import { RouletteMenuResponseDto } from '../dto/roulette-menu.dto';
import { MenuCategory } from '../enum/menu-category.enum';

interface MenuFilter {
  category?: MenuCategory; // 카테고리 필터링
  contexts?: string; // context 필터링을 위한 문자열
  isBest?: boolean;
}

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(Menu.name)
    private readonly menuModel: Model<Menu>,
  ) {}

  async getRouletteMenu(dto: RouletteMenuDto): Promise<RouletteMenuResponseDto[]> {
    const { category, context, limit = 1 } = dto;

    const filter: MenuFilter = {};

    if (category && category !== MenuCategory.ALL) {
      if (category === MenuCategory.BEST) {
        filter.isBest = true;
      } else {
        filter.category = category;
      }
    }

    if (context) {
      filter.contexts = context;
    }

    const menus = await this.menuModel.aggregate<RouletteMenuResponseDto>([
      { $match: filter },
      { $sample: { size: limit } },
      {
        $project: {
          _id: 0,
          id: '$_id',
          name: 1,
          category: 1,
          contexts: 1,
          isBest: 1,
          calorie: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return menus;
  }
}
