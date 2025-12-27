import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.trim());
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 비밀번호 일치 검증
    if (dto.password !== user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 토큰을 랜덤으로 발급
    const accessToken = crypto.randomBytes(32).toString('hex');

    return { accessToken };
  }
}
