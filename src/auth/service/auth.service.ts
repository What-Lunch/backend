import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';

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
import { OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  private generateTokenValue() {
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken,
      accessExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string | null) {
    res.cookie('accessToken', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
  }

  // ============ 토큰 검증 및 사용자 조회 ============
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

  // ============ WebSocket용 토큰 검증 ============
  async verifyToken(accessToken: string) {
    const tokenDoc = await this.tokenModel.findOne({
      value: accessToken,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return null;
    }

    const user = await this.usersService.findById(tokenDoc.userId.toString());
    return user;
  }

  // ============ 액세스 토큰 검증 ============
  async verifyAccessToken(accessToken: string) {
    return this.validateTokenAndGetUser(accessToken);
  }

  // ============ 구글 로그인 ============
  async googleLogin(idToken: string, res: Response) {
    if (!idToken) {
      throw new UnauthorizedException('idToken이 제공되지 않았습니다');
    }
    let payload: TokenPayload | undefined;
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('유효하지 않은 Google idToken입니다');
    }
    if (!payload?.email) {
      throw new UnauthorizedException('Google 계정 정보에 이메일이 없습니다');
    }
    // 사용자 조회 또는 생성
    let user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      user = await this.usersService.create({
        email: payload.email,
        nickname: payload.name || payload.email.split('@')[0],
        profileImage: payload.picture || null,
      });
    }

    // accessToken과 refreshToken 발급
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      this.generateTokenValue();

    try {
      await this.tokenModel.findOneAndUpdate(
        { userId: user._id },
        {
          value: accessToken,
          expiresAt: accessExpiresAt,
          refreshToken,
          refreshExpiresAt,
        },
        { upsert: true, new: true },
      );
    } catch {
      throw new ServiceUnavailableException(
        '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    // 쿠키 설정
    this.setAuthCookies(res, accessToken, refreshToken);

    // 응답 형식을 다른 메서드와 일관성 있게
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage || null,
      },
    };
  }
  // ============ 회원가입 ============
  async signup(dto: RegisterDto, res: Response) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('이미 가입된 이메일입니다');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      nickname: dto.nickname,
      passwordHash: hashedPassword,
    });

    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      this.generateTokenValue();

    try {
      await this.tokenModel.findOneAndUpdate(
        { userId: user._id },
        {
          value: accessToken,
          expiresAt: accessExpiresAt,
          refreshToken,
          refreshExpiresAt,
        },
        { upsert: true, new: true },
      );
    } catch {
      throw new ServiceUnavailableException(
        '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage || null,
      },
    };
  }

  generateTokens() {
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      this.generateTokenValue();
    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    };
  }

  // ============ 로그인 ============
  async login(dto: LoginDto, res: Response) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('소셜 로그인 계정입니다');
    }

    const isValid = user && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } = this.generateTokens();

    try {
      await this.tokenModel.findOneAndUpdate(
        { userId: user._id },
        {
          value: accessToken,
          expiresAt: accessExpiresAt,
          refreshToken,
          refreshExpiresAt,
        },
        { upsert: true, new: true },
      );
    } catch {
      throw new ServiceUnavailableException(
        '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage || null,
      },
    };
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 제공되지 않았습니다');
    }

    const tokenDoc = await this.tokenModel.findOne({ refreshToken });

    if (!tokenDoc || tokenDoc.refreshExpiresAt! < new Date()) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    } = this.generateTokenValue();

    tokenDoc.value = accessToken;
    tokenDoc.expiresAt = accessExpiresAt;
    tokenDoc.refreshToken = newRefreshToken;
    tokenDoc.refreshExpiresAt = refreshExpiresAt;
    await tokenDoc.save();

    this.setAuthCookies(res, accessToken, newRefreshToken);

    const user = await this.usersService.findById(tokenDoc.userId.toString());

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    };
  }

  async logout(accessToken: string, res: Response) {
    if (accessToken) {
      await this.tokenModel.deleteOne({ value: accessToken });
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    return { message: '로그아웃되었습니다' };
  }

  // ============ 내 정보 조회 ============
  async getMe(accessToken: string) {
    const tokenDoc = await this.tokenModel.findOne({
      value: accessToken,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    const user = await this.usersService.findById(tokenDoc.userId.toString());
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage || null,
    };
  }

  // ============ 내 정보 수정 ============
  async updateMe(accessToken: string, updateDto: UpdateMeDto) {
    const tokenDoc = await this.tokenModel.findOne({ value: accessToken });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
    }

    const user = await this.usersService.findById(tokenDoc.userId.toString());

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    // 닉네임 수정
    if (updateDto.nickname) {
      user.nickname = updateDto.nickname;
    }

    // 비밀번호 수정
    if (updateDto.password) {
      user.passwordHash = await bcrypt.hash(updateDto.password, 10);
    }

    // 프로필 이미지 URL 수정
    if (updateDto.profileImage !== undefined) {
      user.profileImage = updateDto.profileImage;
    }

    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage || null,
    };
  }

  // 프로필 이미지 삭제
  async removeProfileImage(accessToken: string) {
    const tokenDoc = await this.tokenModel.findOne({ value: accessToken });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
    }

    const user = await this.usersService.findById(tokenDoc.userId.toString());

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    user.profileImage = null;
    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage || null,
    };
  }

  // 프로필 이미지 업로드용 Presigned URL 생성
  async createProfileImagePresignedUrl(accessToken: string, contentType: string) {
    if (!contentType || !contentType.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다');
    }

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
