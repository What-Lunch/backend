import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Menu } from '../schemas/menu.schemas';
import { RouletteMenuDto, RouletteMenuResponseDto } from '../dto/roulette-menu.dto';
import { MenuCategory } from '../enum/menu-category.enum';
import { RouletteResultDto } from '../dto/roulette-result.dto';
import { RouletteResult } from '../schemas/menu-result.schemas';

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

  // 룰렛 결과 저장
  async saveRouletteResult(body: RouletteResultDto): Promise<RouletteResult> {
    const participantObjectIds = body.participantId.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid participant ID: ${id}`);
      }
      return new Types.ObjectId(id);
    });

    return this.rouletteResultModel.create({
      roomId: body.roomId,
      participantId: participantObjectIds,
      resultMenu: body.resultMenu,
    });
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
