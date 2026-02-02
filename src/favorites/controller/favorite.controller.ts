import {
  Controller,
  Post,
  Delete,
  Body,
  Get,
  UnauthorizedException,
  Header,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { FavoritesService } from '../service/favorites.service';

interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

interface AuthRequest extends Request {
  cookies: AuthCookies;
}

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  private getAccessToken(req: AuthRequest): string {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('인증이 필요합니다');
    }
    return accessToken;
  }

  @Post('add')
  async addFavorite(@Req() req: AuthRequest, @Body('menuId') menuId: string) {
    const token = this.getAccessToken(req);
    return this.favoritesService.addFavorite(token, menuId);
  }

  @Delete('remove')
  async removeFavorite(@Req() req: AuthRequest, @Body('menuId') menuId: string) {
    const token = this.getAccessToken(req);
    return this.favoritesService.removeFavorite(token, menuId);
  }

  // 내 찜 목록 조회
  @Get('list')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMyFavorites(@Req() req: AuthRequest) {
    const token = this.getAccessToken(req);
    return this.favoritesService.getFavorites(token);
  }
}
