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
    const { category, context, limit = 6 } = dto;

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
    if (menus.length < limit) {
      const allPool = await this.menuModel.aggregate<RouletteMenuResponseDto>([
        { $match: filter },
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
      while (menus.length < limit && allPool.length > 0) {
        menus.push(allPool[Math.floor(Math.random() * allPool.length)]);
      }
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
    if (filters.category && filters.category.length > 0) {
      const validCategories: Exclude<MenuCategory, MenuCategory.ALL>[] = filters.category.filter(
        (cat): cat is Exclude<MenuCategory, MenuCategory.ALL> => cat !== MenuCategory.ALL,
      );
      if (validCategories.length > 0) {
        filter.category = { $in: validCategories };
      }
    }

    // context 필터 처리
    if (filters.context && filters.context.length > 0) {
      filter.contexts = { $in: filters.context };
    }

    try {
      let results = await this.menuModel.aggregate<RouletteMenuResponseDto>([
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
      // 샘플이 반환하지 않으면 제한 없이 모든 메뉴 조회
      if (!results || results.length === 0) {
        results = await this.menuModel.aggregate<RouletteMenuResponseDto>([
          { $match: filter },
          { $limit: 6 },
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
      if (results.length < 6 && results.length > 0) {
        // 부족하면 랜덤 중복 채우기
        while (results.length < 6) {
          results.push(results[Math.floor(Math.random() * results.length)]);
        }
      }
      // 항상 같은 순서로 반환 (이름 오름차순)
      return results.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('[MenusService] getMenusByFilters 오류:', error); // 오류 시 제한 없이 모든 메뉴 조회
      const fallback = await this.menuModel.aggregate<RouletteMenuResponseDto>([
        { $match: filter },
        { $limit: 6 },
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
      return fallback.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // 룰렛 결과 저장
  async saveRouletteResult(body: RouletteResultDto): Promise<RouletteResult> {
    const rouletteResult = new this.rouletteResultModel(body);
    return rouletteResult.save();
  }

  // 룰렛 결과를 룸 ID로 조회
  async getRouletteResultsByRoomId(roomId: string): Promise<RouletteResult[]> {
    return this.rouletteResultModel
      .find({ roomId })
      .populate('participantId', 'nickname email profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }
}
