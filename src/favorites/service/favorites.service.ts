import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserFavorite, UserFavoriteDocument } from '../schemas/user-favorite.schema';
import { Token, TokenDocument } from '../../auth/schemas/token.schema';
import { Menu, MenuDocument } from '../../menus/schemas/menu.schemas';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(UserFavorite.name)
    private readonly userFavoriteModel: Model<UserFavoriteDocument>,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Menu.name)
    private readonly menuModel: Model<MenuDocument>,
  ) {}

  private async validateTokenAndGetUserId(accessToken: string): Promise<string> {
    const tokenDoc = await this.tokenModel.findOne({
      value: accessToken,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
    }

    return tokenDoc.userId.toString();
  }

  async getFavorites(accessToken: string) {
    const userId = await this.validateTokenAndGetUserId(accessToken);

    const favorites = await this.userFavoriteModel.find({ userId }).populate('menuId').lean();

    return favorites.map((fav) => fav.menuId);
  }

  async addFavorite(accessToken: string, menuId: string) {
    const userId = await this.validateTokenAndGetUserId(accessToken);

    const existing = await this.userFavoriteModel.findOne({ userId, menuId });
    if (existing) {
      return { message: '이미 즐겨찾기에 추가되어 있습니다' };
    }

    await this.userFavoriteModel.create({ userId, menuId });
    return { message: '즐겨찾기에 추가되었습니다' };
  }

  async removeFavorite(accessToken: string, menuId: string) {
    const userId = await this.validateTokenAndGetUserId(accessToken);

    await this.userFavoriteModel.deleteOne({ userId, menuId });
    return { message: '즐겨찾기에서 삭제되었습니다' };
  }
}
