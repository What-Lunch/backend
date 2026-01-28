import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserFavorite } from '../schemas/user-favorite.schema';
import { MenusService } from '../../menus/service/menus.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(UserFavorite.name)
    private readonly favoriteModel: Model<UserFavorite>,
    private readonly menusService: MenusService,
  ) {}

  // 찜 추가: 실제 신규 생성된 경우만 favoriteCount 증가
  async addFavorite(userId: string, menuId: string) {
    if (!Types.ObjectId.isValid(menuId)) {
      throw new BadRequestException('Invalid menuId');
    }

    const userObjectId = new Types.ObjectId(userId);
    const menuObjectId = new Types.ObjectId(menuId);
    const result = await this.favoriteModel.findOneAndUpdate(
      { userId: userObjectId, menuId: menuObjectId },
      { $setOnInsert: { userId: userObjectId, menuId: menuObjectId } },
      { upsert: true, new: false },
    );

    // 실제로 새로 생성된 경우만 카운트 증가
    if (!result) {
      await this.menusService.increaseFavorite(menuId);

      return {
        isFavorite: true,
        created: true,
      };
    }

    // 이미 찜된 상태
    return {
      isFavorite: true,
      created: false,
    };
  }

  // 찜 제거
  async removeFavorite(userId: string, menuId: string) {
    if (!Types.ObjectId.isValid(menuId)) {
      throw new BadRequestException('Invalid menuId');
    }

    const userObjectId = new Types.ObjectId(userId);
    const menuObjectId = new Types.ObjectId(menuId);

    const result = await this.favoriteModel.deleteOne({
      userId: userObjectId,
      menuId: menuObjectId,
    });

    // 실제 삭제된 경우만 카운트 감소
    if (result.deletedCount === 1) {
      await this.menusService.decreaseFavorite(menuId);
    }

    return {
      isFavorite: false,
      removed: result.deletedCount === 1,
    };
  }

  // 내 찜 목록 조회
  async findMyFavorites(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    return this.favoriteModel
      .find({ userId: userObjectId })
      .populate('menuId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
