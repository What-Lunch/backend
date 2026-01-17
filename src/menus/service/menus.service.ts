import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Menu } from '../schemas/menu.schemas';
import { RouletteMenuDto, RouletteMenuResponseDto } from '../dto/roulette-menu.dto';
import { MenuCategory } from '../enum/menu-category.enum';

interface MenuFilter {
  category?: MenuCategory;
  isBest?: boolean;
  contexts?: {
    $in: string[];
  };
}

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(Menu.name)
    private readonly menuModel: Model<Menu>,
  ) {}

  async getRouletteMenu(dto: RouletteMenuDto): Promise<RouletteMenuResponseDto[]> {
    const { category, context, limit = 8 } = dto;

    const filter: MenuFilter = {};

    if (category && category !== MenuCategory.ALL) {
      if (category === MenuCategory.BEST) {
        filter.isBest = true;
      } else {
        filter.category = category;
      }
    }

    // 상황 필터
    if (context) {
      filter.contexts = { $in: [context] };
    }

    return this.menuModel.aggregate<RouletteMenuResponseDto>([
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
  }
}
