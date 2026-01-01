import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/signup.dto';
import { Token, TokenDocument } from './schemas/token.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async signup(dto: RegisterDto) {
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    } catch {
      throw new InternalServerErrorException('비밀번호 해싱 중 오류가 발생했습니다');
    }

    try {
      const newUser = await this.usersService.create({
        nickname: dto.nickname,
        email: dto.email,
        passwordHash: hashedPassword,
      });

      // 필요 시 분리 : 현재 회원가입이라 분리하면 파일이 더 많아짐
      const userResponse = {
        _id: newUser._id.toString(),
        nickname: newUser.nickname,
        email: newUser.email,
        profile: newUser.profile,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      return userResponse;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('이메일이 이미 등록되었습니다');
      }
      throw new InternalServerErrorException('회원가입 중 오류가 발생했습니다');
    }
  }

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
