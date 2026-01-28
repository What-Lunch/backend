import {
  Controller,
  Post,
  Delete,
  Param,
  Get,
  Headers,
  UnauthorizedException,
  Header,
} from '@nestjs/common';

import { FavoritesService } from '../service/favorites.service';
import { AuthService } from '../../auth/service/auth.service';

@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly authService: AuthService,
  ) {}

  @Post(':menuId')
  async addFavorite(@Headers('authorization') auth: string, @Param('menuId') menuId: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const user = await this.authService.verifyAccessToken(token);
    return this.favoritesService.addFavorite(user._id.toString(), menuId);
  }

  @Delete(':menuId')
  async removeFavorite(@Headers('authorization') auth: string, @Param('menuId') menuId: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const user = await this.authService.verifyAccessToken(token);
    return this.favoritesService.removeFavorite(user._id.toString(), menuId);
  }

  // 캐시 차단 추가
  @Get('list')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMyFavorites(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const user = await this.authService.verifyAccessToken(token);
    return this.favoritesService.findMyFavorites(user._id.toString());
  }
}
