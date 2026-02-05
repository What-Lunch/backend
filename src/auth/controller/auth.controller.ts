import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Patch,
  Delete,
  UnauthorizedException,
  Header,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/signup.dto';
import { UpdateMeDto } from '../dto/update.dto';

interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

interface AuthRequest extends Request {
  cookies: AuthCookies;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============ 로그인 ============
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto, res);
    return result;
  }

  // OAuth 로그인 (Google)
  @Post('oauth/google')
  async googleLogin(@Body() dto: { idToken: string }, @Res({ passthrough: true }) res: Response) {
    return this.authService.googleLogin(dto.idToken, res);
  }

  // ============ 회원가입 ============
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup(signupDto, res);
    return result;
  }
  // ============ Refresh Token ============
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token이 없습니다');
    }

    return this.authService.refresh(refreshToken, res);
  }

  // ============ 로그아웃 ============
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies?.accessToken || '';
    return this.authService.logout(accessToken, res);
  }

  // ============ 내 정보 조회 ============
  @Get('me')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMyInfo(@Req() req: AuthRequest) {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('인증 토큰이 없습니다');
    }

    return this.authService.getMe(accessToken);
  }

  // ============ 내 정보 수정 ============
  @Patch('me')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async updateMe(@Req() req: AuthRequest, @Body() updateDto: UpdateMeDto) {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('인증 토큰이 없습니다');
    }

    return this.authService.updateMe(accessToken, updateDto);
  }

  // ============ 프로필 이미지 삭제 ============
  @Delete('me/profile-image')
  async deleteProfileImage(@Req() req: AuthRequest) {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('인증 토큰이 없습니다');
    }

    return this.authService.removeProfileImage(accessToken);
  }

  // ============ 프로필 이미지 Presigned URL ============
  @Post('profile-image/presign')
  async getProfileImagePresignedUrl(
    @Req() req: AuthRequest,
    @Body('contentType') contentType: string,
  ) {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('인증 토큰이 없습니다');
    }

    return this.authService.createProfileImagePresignedUrl(accessToken, contentType);
  }
}
