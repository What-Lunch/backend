import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
  Header,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from '../auth/service/auth.service';
import { UsersService } from './users.service';

interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

interface AuthRequest extends Request {
  cookies: AuthCookies;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  private async extractUserId(req: AuthRequest): Promise<string> {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('인증 토큰이 없습니다');
    }

    const user = await this.authService.verifyAccessToken(accessToken);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return user._id.toString();
  }

  // 내 음식 도트 목록 조회
  @Get('me/food-dots')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  async getMyFoodDots(@Req() req: AuthRequest) {
    const userId = await this.extractUserId(req);
    return this.usersService.getMyFoodDots(userId);
  }

  // 음식 도트 추가
  @Post('me/food-dots')
  async addFoodDot(@Req() req: AuthRequest, @Body('dotId') dotId: string) {
    const userId = await this.extractUserId(req);
    return this.usersService.addFoodDot(userId, dotId);
  }

  // 음식 도트 제거
  @Delete('me/food-dots/:dotId')
  async removeFoodDot(@Req() req: AuthRequest, @Param('dotId') dotId: string) {
    const userId = await this.extractUserId(req);
    return this.usersService.removeFoodDot(userId, dotId);
  }
}
