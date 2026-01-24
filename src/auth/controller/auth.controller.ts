import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Patch,
  Delete,
  Headers,
  UnauthorizedException,
  Header,
} from '@nestjs/common';

import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/signup.dto';
import { UpdateMeDto } from '../dto/update.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 로그인
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 회원가입
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() registerDto: RegisterDto) {
    return this.authService.signup(registerDto);
  }

  // 내 정보 조회
  @Get('me')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMyInfo(@Headers('authorization') authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다');
    }

    const [scheme, accessToken] = authorization.split(' ');

    if (scheme !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Authorization 형식이 올바르지 않습니다');
    }

    return this.authService.getMe(accessToken);
  }

  // 내 정보 수정 (닉네임 / 비밀번호 / 프로필 이미지 URL)
  @Patch('me')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async updateMyInfo(
    @Headers('authorization') authorization: string,
    @Body() updateMeDto: UpdateMeDto,
  ) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다');
    }

    const [scheme, accessToken] = authorization.split(' ');

    if (scheme !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Authorization 형식이 올바르지 않습니다');
    }

    return this.authService.updateMe(accessToken, updateMeDto);
  }

  // 프로필 이미지 삭제 (기본 이미지로 초기화)
  @Delete('me/profile-image')
  async deleteProfileImage(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다');
    }

    const [scheme, accessToken] = authorization.split(' ');

    if (scheme !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Authorization 형식이 올바르지 않습니다');
    }

    return this.authService.removeProfileImage(accessToken);
  }

  // 프로필 이미지 업로드용 presigned URL 발급
  @Post('profile-image/presign')
  async getProfileImagePresignedUrl(
    @Headers('authorization') authorization: string,
    @Body('contentType') contentType: string,
  ) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다');
    }

    const [scheme, accessToken] = authorization.split(' ');

    if (scheme !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Authorization 형식이 올바르지 않습니다');
    }

    return this.authService.createProfileImagePresignedUrl(contentType);
  }
}
