import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Patch,
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
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // 회원가입
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: RegisterDto) {
    return this.authService.signup(dto);
  }

  // 내 정보 조회
  @Get('me')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async me(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization 형식이 올바르지 않습니다');
    }

    return this.authService.getMe(token);
  }

  // 내 정보 수정 (닉네임 / 비밀번호 / 둘 다)
  @Patch('me')
  async updateMe(@Headers('authorization') authHeader: string, @Body() dto: UpdateMeDto) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization 형식이 올바르지 않습니다');
    }

    return this.authService.updateMe(token, dto);
  }
}
