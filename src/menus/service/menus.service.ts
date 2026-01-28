import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Menu } from '../schemas/menu.schemas';
import { RouletteMenuDto, RouletteMenuResponseDto } from '../dto/roulette-menu.dto';
import { MenuCategory } from '../enum/menu-category.enum';
import { RouletteResultDto } from '../dto/roulette-result.dto';
import { RouletteResult } from '../schemas/menu-result.schemas';
import { MenuContext } from '../enum/menu-context.enum';

type CategoryInQuery = { $in: Exclude<MenuCategory, MenuCategory.ALL>[] };
interface MenuFilter {
  category?: MenuCategory | CategoryInQuery;
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
    @InjectModel(RouletteResult.name)
    private readonly rouletteResultModel: Model<RouletteResult>,
  ) {}

  // 룰렛 메뉴 조회
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

    if (context) {
      filter.contexts = { $in: [context] };
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

  async getMenusByFilters(
    filters: {
      category?: MenuCategory[];
      context?: MenuContext[];
    } = {},
  ): Promise<RouletteMenuResponseDto[]> {
    const filter: MenuFilter = {};

    if (filters.category?.length) {
      const validCategories = filters.category.filter(
        (cat): cat is Exclude<MenuCategory, MenuCategory.ALL> => cat !== MenuCategory.ALL,
      );
      if (validCategories.length) {
        filter.category = { $in: validCategories };
      }
    }

    if (filters.context?.length) {
      filter.contexts = { $in: filters.context };
    }

    const results = await this.menuModel.aggregate<RouletteMenuResponseDto>([
      { $match: filter },
      { $sample: { size: 6 } },
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

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 룰렛 결과
  async saveRouletteResult(body: RouletteResultDto): Promise<RouletteResult> {
    return new this.rouletteResultModel(body).save();
  }

  async getRouletteResultsByRoomId(roomId: string): Promise<RouletteResult[]> {
    return this.rouletteResultModel
      .find({ roomId })
      .populate('participantId', 'nickname email profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }

  // 찜 관리
  async increaseFavorite(menuId: string): Promise<void> {
    if (!Types.ObjectId.isValid(menuId)) {
      throw new BadRequestException('Invalid menuId');
    }

    await this.menuModel.updateOne({ _id: menuId }, { $inc: { favoriteCount: 1 } });
  }

  async decreaseFavorite(menuId: string): Promise<void> {
    if (!Types.ObjectId.isValid(menuId)) {
      throw new BadRequestException('Invalid menuId');
    }

    await this.menuModel.updateOne(
      { _id: menuId, favoriteCount: { $gt: 0 } },
      { $inc: { favoriteCount: -1 } },
    );
  }

  // 찜 랭킹 3순위
  async getTopFavoriteMenus(limit = 3) {
    return this.menuModel
      .find({ favoriteCount: { $gt: 0 } })
      .sort({ favoriteCount: -1 })
      .limit(limit)
      .select('name category favoriteCount')
      .lean()
      .exec();
  }
}
