import {
  Controller,
  Post,
  Delete,
  Body,
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

  @Post('add')
  async addFavorite(@Headers('authorization') auth: string, @Body('menuId') menuId: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const user = await this.authService.verifyAccessToken(token);
    return this.favoritesService.addFavorite(user._id.toString(), menuId);
  }

  @Delete('remove')
  async removeFavorite(@Headers('authorization') auth: string, @Body('menuId') menuId: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const user = await this.authService.verifyAccessToken(token);
    return this.favoritesService.removeFavorite(user._id.toString(), menuId);
  }

  // 내 찜 목록 조회
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
