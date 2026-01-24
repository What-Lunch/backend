import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

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

  // 토큰 검증 및 사용자 조회
  private async validateTokenAndGetUser(accessToken: string) {
    const token = await this.tokenModel.findOne({ value: accessToken });
    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다');
    }
    const user = await this.usersService.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  // 액세스 토큰 검증
  async verifyAccessToken(accessToken: string) {
    return this.validateTokenAndGetUser(accessToken);
  }

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
        email: dto.email,
        nickname: dto.nickname,
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

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const isValid = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }
    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      await this.tokenModel.findOneAndUpdate(
        { userId: user._id },
        { value: accessToken, expiresAt },
        { upsert: true, new: true },
      );
    } catch {
      throw new ServiceUnavailableException(
        '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
    return {
      accessToken,
      expiresAt,
      user: {
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    };
  }

  // 내 정보 조회
  async getMe(accessToken: string) {
    const user = await this.validateTokenAndGetUser(accessToken);
    return {
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
    };
  }

  // 내 정보 수정
  async updateMe(accessToken: string, dto: UpdateMeDto) {
    const user = await this.validateTokenAndGetUser(accessToken);
    const updateData: Record<string, any> = {};
    if (dto.nickname) updateData.nickname = dto.nickname;
    if (dto.password) {
      try {
        updateData.passwordHash = await bcrypt.hash(dto.password, 10);
      } catch {
        throw new InternalServerErrorException('비밀번호 해싱 중 오류가 발생했습니다');
      }
    }
    if (dto.profileImage) updateData.profileImage = dto.profileImage;
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('변경할 정보가 제공되지 않았습니다');
    }
    const updatedUser = await this.usersService.updateById(user._id, updateData);
    if (dto.password) {
      await this.tokenModel.deleteMany({ userId: user._id, value: { $ne: accessToken } });
    }
    return {
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      profileImage: updatedUser.profileImage,
    };
  }

  // 프로필 이미지 업로드용 Presigned URL 생성
  async createProfileImagePresignedUrl(contentType: string) {
    if (!contentType || !contentType.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다');
    }

    // S3 Client 생성
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });

    const fileKey = `profile-images/${uuidv4()}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60, // 1분 유효
      });

      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      return { uploadUrl, fileUrl };
    } catch (error) {
      console.error('S3 Presign Error Details:', error);
      throw new InternalServerErrorException(
        '프로필 이미지 업로드 URL 생성 중 오류가 발생했습니다',
      );
    }
  }
}
