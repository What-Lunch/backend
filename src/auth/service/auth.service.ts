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

import { UsersService } from '../../users/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/signup.dto';
import { UpdateMeDto } from '../dto/update.dto';
import { Token, TokenDocument } from '../schemas/token.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  // 회원가입
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

      return {
        email: newUser.email,
        nickname: newUser.nickname,
        profileImage: newUser.profileImage,
      };
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

  // 로그인
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

  // 내 정보 조회
  async getMe(accessToken: string) {
    const token = await this.tokenModel.findOne({ value: accessToken });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다');
    }

    const user = await this.usersService.findById(token.userId);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return {
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
    };
  }

  // 내 정보 수정
  async updateMe(accessToken: string, dto: UpdateMeDto) {
    // 토큰 검증
    const token = await this.tokenModel.findOne({ value: accessToken });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다');
    }

    const user = await this.usersService.findById(token.userId);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const updateData: Record<string, any> = {};

    if (dto.nickname) {
      updateData.nickname = dto.nickname;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // 변경 사항 없으면 그대로 반환
    if (Object.keys(updateData).length === 0) {
      return {
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      };
    }

    // 유저 정보 업데이트
    const updatedUser = await this.usersService.updateById(user._id, updateData);

    // 비밀번호 변경 시 모든 토큰 무효화
    if (dto.password) {
      await this.tokenModel.deleteMany({ userId: user._id });
    }

    return {
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      profileImage: updatedUser.profileImage,
    };
  }
}
