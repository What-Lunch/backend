import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Menu } from '../schemas/menu.schemas';
import { RouletteMenuDto, RouletteMenuResponseDto } from '../dto/roulette-menu.dto';
import { MenuCategory } from '../enum/menu-category.enum';
import { RouletteResultDto } from '../dto/roulette-result.dto';
import { RouletteResult } from '../schemas/menu-result.schemas';
import { MenuContext } from '../enum/menu-context.enum';

type CategoryInQuery = { $in: Exclude<MenuCategory, MenuCategory.ALL | MenuCategory.BEST>[] };

interface MenuFilter {
  category?: MenuCategory | CategoryInQuery;
  isBest?: boolean;
  contexts?: {
    $in: MenuContext[];
  };
}

const MENU_PROJECTION = {
  _id: 0,
  id: '$_id',
  name: 1,
  category: 1,
  contexts: 1,
  isBest: 1,
  calorie: 1,
  createdAt: 1,
  updatedAt: 1,
};

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

    // 카테고리만 필터링
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

    let menus = await this.menuModel.aggregate<RouletteMenuResponseDto>([
      { $match: filter },
      { $sample: { size: limit } },
      { $project: MENU_PROJECTION },
    ]);

    // fallback: 조건 결과가 0개일 때만 전체 랜덤
    if (menus.length === 0) {
      menus = await this.menuModel.aggregate<RouletteMenuResponseDto>([
        { $sample: { size: limit } },
        { $project: MENU_PROJECTION },
      ]);
    }

    return menus;
  }

  // 조건에 맞는 메뉴 조회 (필터가 없으면 전체 메뉴)
  async getMenusByFilters(
    filters: {
      category?: MenuCategory[];
      context?: MenuContext[];
    } = {},
  ): Promise<RouletteMenuResponseDto[]> {
    const filter: MenuFilter = {};

    // category 필터 처리
    if (filters.category?.length) {
      const validCategories = filters.category.filter(
        (cat): cat is Exclude<MenuCategory, MenuCategory.ALL | MenuCategory.BEST> =>
          cat !== MenuCategory.ALL && cat !== MenuCategory.BEST,
      );

      if (validCategories.length) {
        filter.category = { $in: validCategories };
      }
    }

    // context 필터 처리
    if (filters.context?.length) {
      filter.contexts = { $in: filters.context };
    }

    let results = await this.menuModel.aggregate<RouletteMenuResponseDto>([
      { $match: filter },
      { $sample: { size: 6 } },
      { $project: MENU_PROJECTION },
    ]);

    // fallback: 필터 결과가 0개일 때만 전체 랜덤
    if (results.length === 0) {
      results = await this.menuModel.aggregate<RouletteMenuResponseDto>([
        { $sample: { size: 6 } },
        { $project: MENU_PROJECTION },
      ]);
    }

    // 항상 동일한 순서
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 룰렛 결과 저장
  async saveRouletteResult(body: RouletteResultDto): Promise<RouletteResult> {
    const rouletteResult = new this.rouletteResultModel(body);
    return rouletteResult.save();
  }

  // 룰렛 결과 조회 (룸 기준)
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

  // 찜 랭킹 TOP
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
