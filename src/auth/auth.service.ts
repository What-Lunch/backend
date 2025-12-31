import { Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Token } from './schemas/token.schema';
import type { TokenDocument } from './schemas/token.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    const isValid = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await this.tokenModel.deleteMany({ userId: user._id });

      await this.tokenModel.create({
        value: accessToken,
        userId: user._id,
        expiresAt,
      });
    } catch {
      throw new ServiceUnavailableException(
        '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    return { accessToken, expiresAt };
  }
}
